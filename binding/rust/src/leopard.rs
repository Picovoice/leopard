/*
    Copyright 2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
*/

use std::cmp::PartialEq;
use std::ffi::{CStr, CString};
use std::ffi::OsStr;
use std::path::{Path, PathBuf};
use std::ptr::addr_of_mut;
use std::sync::Arc;

use libc::{c_char, c_void};
use libloading::{Library, Symbol};
#[cfg(unix)]
use libloading::os::unix::Symbol as RawSymbol;
#[cfg(windows)]
use libloading::os::windows::Symbol as RawSymbol;

use crate::util::{pathbuf_to_cstring, pv_library_path, pv_model_path};

#[repr(C)]
struct CLeopard {}

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
    object: *mut *mut CLeopard,
) -> PvStatus;
type PvSampleRateFn = unsafe extern "C" fn() -> i32;
type PvLeopardVersionFn = unsafe extern "C" fn() -> *mut c_char;
type PvLeopardProcessFn = unsafe extern "C" fn(
    object: *mut CLeopard,
    pcm: *const i16,
    num_samples: i32,
    transcript: *mut *mut c_char,
) -> PvStatus;
type PvLeopardProcessFileFn = unsafe extern "C" fn(
    object: *mut CLeopard,
    audio_path: *const c_char,
    transcript: *mut *mut c_char,
) -> PvStatus;
type PvLeopardDeleteFn = unsafe extern "C" fn(object: *mut CLeopard);

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
    library_path: PathBuf,
    model_path: PathBuf,
}

impl LeopardBuilder {
    pub fn new<S: Into<String>>(access_key: S) -> Self {
        Self {
            access_key: access_key.into(),
            model_path: pv_model_path(),
            library_path: pv_library_path()
        }
    }

    pub fn access_key<S: Into<String>>(&mut self, access_key: S) -> &mut Self {
        self.access_key = access_key.into();
        self
    }

    pub fn library_path<P: Into<PathBuf>>(&mut self, library_path: P) -> &mut Self {
        self.library_path = library_path.into();
        self
    }

    pub fn model_path<P: Into<PathBuf>>(&mut self, model_path: P) -> &mut Self {
        self.model_path = model_path.into();
        self
    }

    pub fn init(&self) -> Result<Leopard, LeopardError> {
        let inner = LeopardInner::init(
            &self.access_key,
            &self.library_path,
            &self.model_path,
        );
        match inner {
            Ok(inner) => Ok(Leopard {
                inner: Arc::new(inner),
            }),
            Err(err) => Err(err),
        }
    }
}

#[derive(Clone)]
pub struct Leopard {
    inner: Arc<LeopardInner>,
}

impl Leopard {
    pub fn process(&self, pcm: &[i16]) -> Result<String, LeopardError> {
        self.inner.process(pcm)
    }

    pub fn process_file<P: AsRef<Path>>(&self, audio_path: P) -> Result<String, LeopardError> {
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
            format!(
                "Function '{}' in the leopard library failed",
                function_name
            ),
        )),
    }
}

struct LeopardInnerVTable {
    pv_leopard_process: RawSymbol<PvLeopardProcessFn>,
    pv_leopard_process_file: RawSymbol<PvLeopardProcessFileFn>,
    pv_leopard_delete: RawSymbol<PvLeopardDeleteFn>,

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

const VALID_EXTENSIONS: [&str; 6] = ["flac", "mp3", "ogg", "opus", "wav", "webm"];

impl LeopardInner {
    pub fn init<P: AsRef<Path>>(
        access_key: &str,
        library_path: P,
        model_path: P,
    ) -> Result<Self, LeopardError> {
        if !library_path.as_ref().exists() {
            return Err(LeopardError::new(
                LeopardErrorStatus::ArgumentError,
                format!(
                    "Couldn't find Leopard's dynamic library at {}",
                    library_path.as_ref().display()
                ),
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
            let pv_leopard_init =
                load_library_fn::<PvLeopardInitFn>(&lib, b"pv_leopard_init")?;
            let pv_sample_rate = load_library_fn::<PvSampleRateFn>(&lib, b"pv_sample_rate")?;
            let pv_leopard_version =
                load_library_fn::<PvLeopardVersionFn>(&lib, b"pv_leopard_version")?;

            let status = pv_leopard_init(
                access_key.as_ptr(),
                pv_model_path.as_ptr(),
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

    pub fn process(&self, pcm: &[i16]) -> Result<String, LeopardError> {
        if pcm.len() == 0 {
            return Err(LeopardError::new(
                LeopardErrorStatus::FrameLengthError,
                format!(
                    "Audio data must not be empty"
                ),
            ));
        }

        let transcript: String;
        unsafe {
            let mut transcript_ptr: *mut c_char = std::ptr::null_mut();

            let status = (self.vtable.pv_leopard_process)(self.cleopard, pcm.as_ptr(), pcm.len() as i32, addr_of_mut!(transcript_ptr));

            check_fn_call_status(status, "pv_leopard_process")?;

            transcript = String::from(CStr::from_ptr(transcript_ptr).to_str().map_err(|_| {
                LeopardError::new(
                    LeopardErrorStatus::LibraryError(PvStatus::RUNTIME_ERROR),
                    "Failed to convert transcript string"
                )
            })?);

            libc::free(transcript_ptr as *mut c_void);
        };

        Ok(transcript)
    }

    pub fn process_file<P: AsRef<Path>>(&self, audio_path: P) -> Result<String, LeopardError> {
        if !audio_path.as_ref().exists() {
            return Err(LeopardError::new(
                LeopardErrorStatus::ArgumentError,
                format!(
                    "Could not find the audio file at `{}`",
                    audio_path.as_ref().display()
                ),
            ));
        }

        let transcript: String;
        let pv_audio_path = pathbuf_to_cstring(&audio_path);
        unsafe {
            let mut transcript_ptr: *mut c_char = std::ptr::null_mut();

            let status = (self.vtable.pv_leopard_process_file)(self.cleopard, pv_audio_path.as_ptr(), addr_of_mut!(transcript_ptr));

            if status != PvStatus::SUCCESS {
                let extension = audio_path.as_ref().extension().unwrap_or(OsStr::new("")).to_str().unwrap_or("");
                if !VALID_EXTENSIONS.contains(&extension) {
                    return Err(LeopardError::new(
                        LeopardErrorStatus::ArgumentError,
                        format!(
                            "Specified file with extension '{}' is not supported",
                            extension
                        )
                    ))
                }

                check_fn_call_status(status, "pv_leopard_process_file")?;
            }

            transcript = String::from(CStr::from_ptr(transcript_ptr).to_str().map_err(|_| {
                LeopardError::new(
                    LeopardErrorStatus::LibraryError(PvStatus::RUNTIME_ERROR),
                    "Failed to convert transcript string"
                )
            })?);

            libc::free(transcript_ptr as *mut c_void);
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
