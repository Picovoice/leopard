/*
    Copyright 2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
*/

use std::cmp::PartialEq;
use std::ffi::OsStr;
use std::ffi::{CStr, CString};
use std::path::{Path, PathBuf};
use std::ptr::addr_of_mut;
use std::sync::Arc;

use libc::{c_char, c_void};
#[cfg(unix)]
use libloading::os::unix::Symbol as RawSymbol;
#[cfg(windows)]
use libloading::os::windows::Symbol as RawSymbol;
use libloading::{Library, Symbol};

use crate::util::{pathbuf_to_cstring, pv_library_path, pv_model_path};

#[repr(C)]
struct CLeopard {}

#[repr(C)]
struct CLeopardWord {
    word: *const c_char,
    start_sec: f32,
    end_sec: f32,
    confidence: f32,
}

#[repr(C)]
#[derive(PartialEq, Clone, Debug)]
#[allow(non_camel_case_types)]
pub enum PvStatus {
    SUCCESS = 0,
    OUT_OF_MEMORY = 1,
    IO_ERROR = 2,
    INVALID_ARGUMENT = 3,
    STOP_ITERATION = 4,
    KEY_ERROR = 5,
    INVALID_STATE = 6,
    RUNTIME_ERROR = 7,
    ACTIVATION_ERROR = 8,
    ACTIVATION_LIMIT_REACHED = 9,
    ACTIVATION_THROTTLED = 10,
    ACTIVATION_REFUSED = 11,
}

type PvLeopardInitFn = unsafe extern "C" fn(
    access_key: *const c_char,
    model_path: *const c_char,
    enable_automatic_punctuation: bool,
    object: *mut *mut CLeopard,
) -> PvStatus;
type PvSampleRateFn = unsafe extern "C" fn() -> i32;
type PvLeopardVersionFn = unsafe extern "C" fn() -> *mut c_char;
type PvLeopardProcessFn = unsafe extern "C" fn(
    object: *mut CLeopard,
    pcm: *const i16,
    num_samples: i32,
    transcript: *mut *mut c_char,
    num_words: *mut i32,
    words: *mut *mut CLeopardWord,
) -> PvStatus;
type PvLeopardProcessFileFn = unsafe extern "C" fn(
    object: *mut CLeopard,
    audio_path: *const c_char,
    transcript: *mut *mut c_char,
    num_words: *mut i32,
    words: *mut *mut CLeopardWord,
) -> PvStatus;
type PvLeopardDeleteFn = unsafe extern "C" fn(object: *mut CLeopard);
type PvFreeFn = unsafe extern "C" fn(*mut c_void);

#[derive(Clone, Debug)]
pub enum LeopardErrorStatus {
    LibraryError(PvStatus),
    LibraryLoadError,
    FrameLengthError,
    ArgumentError,
}

#[derive(Clone, Debug)]
pub struct LeopardError {
    status: LeopardErrorStatus,
    message: String,
}

impl LeopardError {
    pub fn new(status: LeopardErrorStatus, message: impl Into<String>) -> Self {
        Self {
            status,
            message: message.into(),
        }
    }
}

impl std::fmt::Display for LeopardError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {:?}", self.message, self.status)
    }
}

impl std::error::Error for LeopardError {}

pub struct LeopardBuilder {
    access_key: String,
    model_path: PathBuf,
    library_path: PathBuf,
    enable_automatic_punctuation: bool,
}

impl LeopardBuilder {
    const DEFAULT_ENABLE_AUTOMATIC_PUNCTUATION: bool = false;

    pub fn new() -> Self {
        Self {
            access_key: String::from(""),
            model_path: pv_model_path(),
            library_path: pv_library_path(),
            enable_automatic_punctuation: Self::DEFAULT_ENABLE_AUTOMATIC_PUNCTUATION,
        }
    }

    pub fn access_key<S: Into<String>>(&mut self, access_key: S) -> &mut Self {
        self.access_key = access_key.into();
        self
    }

    pub fn model_path<P: Into<PathBuf>>(&mut self, model_path: P) -> &mut Self {
        self.model_path = model_path.into();
        self
    }

    pub fn library_path<P: Into<PathBuf>>(&mut self, library_path: P) -> &mut Self {
        self.library_path = library_path.into();
        self
    }

    pub fn enable_automatic_punctuation(
        &mut self,
        enable_automatic_punctuation: bool,
    ) -> &mut Self {
        self.enable_automatic_punctuation = enable_automatic_punctuation;
        self
    }

    pub fn init(&self) -> Result<Leopard, LeopardError> {
        let inner = LeopardInner::init(
            &self.access_key,
            &self.model_path,
            &self.library_path,
            self.enable_automatic_punctuation,
        );
        match inner {
            Ok(inner) => Ok(Leopard {
                inner: Arc::new(inner),
            }),
            Err(err) => Err(err),
        }
    }
}

#[derive(PartialEq, Clone, Debug)]
pub struct LeopardWord {
    pub word: String,
    pub start_sec: f32,
    pub end_sec: f32,
    pub confidence: f32,
}

impl From<&CLeopardWord> for Result<LeopardWord, LeopardError> {
    fn from(c_leopard_word: &CLeopardWord) -> Self {
        let word = unsafe {
            String::from(CStr::from_ptr(c_leopard_word.word).to_str().map_err(|_| {
                LeopardError::new(
                    LeopardErrorStatus::LibraryError(PvStatus::RUNTIME_ERROR),
                    "Failed to convert metadata word string",
                )
            })?)
        };

        Ok(LeopardWord {
            word: word,
            start_sec: c_leopard_word.start_sec,
            end_sec: c_leopard_word.end_sec,
            confidence: c_leopard_word.confidence,
        })
    }
}

#[derive(PartialEq, Clone, Debug)]
pub struct LeopardTranscript {
    pub transcript: String,
    pub words: Vec<LeopardWord>,
}

#[derive(Clone)]
pub struct Leopard {
    inner: Arc<LeopardInner>,
}

impl Leopard {
    pub fn process(&self, pcm: &[i16]) -> Result<LeopardTranscript, LeopardError> {
        self.inner.process(pcm)
    }

    pub fn process_file<P: AsRef<Path>>(
        &self,
        audio_path: P,
    ) -> Result<LeopardTranscript, LeopardError> {
        self.inner.process_file(audio_path)
    }

    pub fn sample_rate(&self) -> u32 {
        self.inner.sample_rate as u32
    }

    pub fn version(&self) -> &str {
        &self.inner.version
    }
}

unsafe fn load_library_fn<T>(
    library: &Library,
    function_name: &[u8],
) -> Result<RawSymbol<T>, LeopardError> {
    library
        .get(function_name)
        .map(|s: Symbol<T>| s.into_raw())
        .map_err(|err| {
            LeopardError::new(
                LeopardErrorStatus::LibraryLoadError,
                format!(
                    "Failed to load function symbol from leopard library: {}",
                    err
                ),
            )
        })
}

fn check_fn_call_status(status: PvStatus, function_name: &str) -> Result<(), LeopardError> {
    match status {
        PvStatus::SUCCESS => Ok(()),
        _ => Err(LeopardError::new(
            LeopardErrorStatus::LibraryError(status),
            format!("Function '{}' in the leopard library failed", function_name),
        )),
    }
}

struct LeopardInnerVTable {
    pv_leopard_process: RawSymbol<PvLeopardProcessFn>,
    pv_leopard_process_file: RawSymbol<PvLeopardProcessFileFn>,
    pv_leopard_delete: RawSymbol<PvLeopardDeleteFn>,
    pv_free: RawSymbol<PvFreeFn>,

    _lib_guard: Library,
}

impl LeopardInnerVTable {
    pub fn new(lib: Library) -> Result<Self, LeopardError> {
        // SAFETY: the library will be hold by this struct and therefore the symbols can't outlive the library
        unsafe {
            Ok(Self {
                pv_leopard_process: load_library_fn(&lib, b"pv_leopard_process")?,
                pv_leopard_process_file: load_library_fn(&lib, b"pv_leopard_process_file")?,
                pv_leopard_delete: load_library_fn(&lib, b"pv_leopard_delete")?,
                pv_free: load_library_fn(&lib, b"pv_free")?,

                _lib_guard: lib,
            })
        }
    }
}

struct LeopardInner {
    cleopard: *mut CLeopard,
    sample_rate: i32,
    version: String,
    vtable: LeopardInnerVTable,
}

const VALID_EXTENSIONS: [&str; 10] = [
    "3gp", "flac", "m4a", "mp3", "mp4", "ogg", "opus", "vorbis", "wav", "webm",
];

impl LeopardInner {
    pub fn init<P: AsRef<Path>>(
        access_key: &str,
        model_path: P,
        library_path: P,
        enable_automatic_punctuation: bool,
    ) -> Result<Self, LeopardError> {
        if access_key == "" {
            return Err(LeopardError::new(
                LeopardErrorStatus::ArgumentError,
                "AccessKey is empty",
            ));
        }

        if !model_path.as_ref().exists() {
            return Err(LeopardError::new(
                LeopardErrorStatus::ArgumentError,
                format!(
                    "Couldn't find model file at {}",
                    model_path.as_ref().display()
                ),
            ));
        }

        if !library_path.as_ref().exists() {
            return Err(LeopardError::new(
                LeopardErrorStatus::ArgumentError,
                format!(
                    "Couldn't find Leopard's dynamic library at {}",
                    library_path.as_ref().display()
                ),
            ));
        }

        let lib = unsafe { Library::new(library_path.as_ref()) }.map_err(|err| {
            LeopardError::new(
                LeopardErrorStatus::LibraryLoadError,
                format!("Failed to load leopard dynamic library: {}", err),
            )
        })?;

        let access_key = match CString::new(access_key) {
            Ok(access_key) => access_key,
            Err(err) => {
                return Err(LeopardError::new(
                    LeopardErrorStatus::ArgumentError,
                    format!("AccessKey is not a valid C string {}", err),
                ))
            }
        };
        let mut cleopard = std::ptr::null_mut();
        let pv_model_path = pathbuf_to_cstring(&model_path);

        // SAFETY: most of the unsafe comes from the `load_library_fn` which is
        // safe, because we don't use the raw symbols after this function
        // anymore.
        let (sample_rate, version) = unsafe {
            let pv_leopard_init = load_library_fn::<PvLeopardInitFn>(&lib, b"pv_leopard_init")?;
            let pv_sample_rate = load_library_fn::<PvSampleRateFn>(&lib, b"pv_sample_rate")?;
            let pv_leopard_version =
                load_library_fn::<PvLeopardVersionFn>(&lib, b"pv_leopard_version")?;

            let status = pv_leopard_init(
                access_key.as_ptr(),
                pv_model_path.as_ptr(),
                enable_automatic_punctuation,
                addr_of_mut!(cleopard),
            );
            check_fn_call_status(status, "pv_leopard_init")?;

            let version = match CStr::from_ptr(pv_leopard_version()).to_str() {
                Ok(string) => string.to_string(),
                Err(err) => {
                    return Err(LeopardError::new(
                        LeopardErrorStatus::LibraryLoadError,
                        format!("Failed to get version info from Leopard Library: {}", err),
                    ))
                }
            };

            (pv_sample_rate(), version)
        };

        Ok(Self {
            cleopard,
            sample_rate,
            version,
            vtable: LeopardInnerVTable::new(lib)?,
        })
    }

    pub fn process(&self, pcm: &[i16]) -> Result<LeopardTranscript, LeopardError> {
        if pcm.len() == 0 {
            return Err(LeopardError::new(
                LeopardErrorStatus::FrameLengthError,
                format!("Audio data must not be empty"),
            ));
        }

        let transcript = unsafe {
            let mut transcript_ptr: *mut c_char = std::ptr::null_mut();
            let mut num_words: i32 = 0;
            let mut words_ptr: *mut CLeopardWord = std::ptr::null_mut();

            let status = (self.vtable.pv_leopard_process)(
                self.cleopard,
                pcm.as_ptr(),
                pcm.len() as i32,
                addr_of_mut!(transcript_ptr),
                addr_of_mut!(num_words),
                addr_of_mut!(words_ptr),
            );

            check_fn_call_status(status, "pv_leopard_process")?;

            let transcript =
                String::from(CStr::from_ptr(transcript_ptr).to_str().map_err(|_| {
                    LeopardError::new(
                        LeopardErrorStatus::LibraryError(PvStatus::RUNTIME_ERROR),
                        "Failed to convert transcript string",
                    )
                })?);
            (self.vtable.pv_free)(transcript_ptr as *mut c_void);

            let words = std::slice::from_raw_parts(words_ptr, num_words as usize)
                .iter()
                .map(|c_word| c_word.into())
                .collect::<Result<Vec<LeopardWord>, LeopardError>>()?;
            (self.vtable.pv_free)(words_ptr as *mut c_void);

            LeopardTranscript { transcript, words }
        };

        Ok(transcript)
    }

    pub fn process_file<P: AsRef<Path>>(
        &self,
        audio_path: P,
    ) -> Result<LeopardTranscript, LeopardError> {
        if !audio_path.as_ref().exists() {
            return Err(LeopardError::new(
                LeopardErrorStatus::ArgumentError,
                format!(
                    "Could not find the audio file at `{}`",
                    audio_path.as_ref().display()
                ),
            ));
        }

        let pv_audio_path = pathbuf_to_cstring(&audio_path);
        let transcript = unsafe {
            let mut transcript_ptr: *mut c_char = std::ptr::null_mut();
            let mut num_words: i32 = 0;
            let mut words_ptr: *mut CLeopardWord = std::ptr::null_mut();

            let status = (self.vtable.pv_leopard_process_file)(
                self.cleopard,
                pv_audio_path.as_ptr(),
                addr_of_mut!(transcript_ptr),
                addr_of_mut!(num_words),
                addr_of_mut!(words_ptr),
            );

            if status != PvStatus::SUCCESS {
                let extension = audio_path
                    .as_ref()
                    .extension()
                    .unwrap_or(OsStr::new(""))
                    .to_str()
                    .unwrap_or("");
                if !VALID_EXTENSIONS.contains(&extension) {
                    return Err(LeopardError::new(
                        LeopardErrorStatus::ArgumentError,
                        format!(
                            "Specified file with extension '{}' is not supported",
                            extension
                        ),
                    ));
                }

                check_fn_call_status(status, "pv_leopard_process_file")?;
            }

            let transcript =
                String::from(CStr::from_ptr(transcript_ptr).to_str().map_err(|_| {
                    LeopardError::new(
                        LeopardErrorStatus::LibraryError(PvStatus::RUNTIME_ERROR),
                        "Failed to convert transcript string",
                    )
                })?);

            (self.vtable.pv_free)(transcript_ptr as *mut c_void);

            let words = std::slice::from_raw_parts(words_ptr, num_words as usize)
                .iter()
                .map(|c_word| c_word.into())
                .collect::<Result<Vec<LeopardWord>, LeopardError>>()?;
            (self.vtable.pv_free)(words_ptr as *mut c_void);

            LeopardTranscript { transcript, words }
        };

        Ok(transcript)
    }
}

unsafe impl Send for LeopardInner {}
unsafe impl Sync for LeopardInner {}

impl Drop for LeopardInner {
    fn drop(&mut self) {
        unsafe {
            (self.vtable.pv_leopard_delete)(self.cleopard);
        }
    }
}
