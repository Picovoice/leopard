// Copyright 2022-2023 Picovoice Inc.
//
// You may not use this file except in compliance with the license. A copy of the license is
// located in the "LICENSE" file accompanying this source.
//
// Unless required by applicable law or agreed to in writing, software distributed under the
// License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
// express or implied. See the License for the specific language governing permissions and
// limitations under the License.
//

// Go binding for Leopard Speech-to-Text engine.

package leopard

/*
#cgo linux LDFLAGS: -ldl
#cgo darwin LDFLAGS: -ldl
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>

#if defined(_WIN32) || defined(_WIN64)

	#include <windows.h>

#else

	#include <dlfcn.h>

#endif

static void *open_dl(const char *dl_path) {

#if defined(_WIN32) || defined(_WIN64)

	return LoadLibrary((LPCSTR) dl_path);

#else

	return dlopen(dl_path, RTLD_NOW);

#endif

}

static void *load_symbol(void *handle, const char *symbol) {

#if defined(_WIN32) || defined(_WIN64)

	return GetProcAddress((HMODULE) handle, symbol);

#else

	return dlsym(handle, symbol);

#endif

}

typedef struct {
	const char *word;
	float start_sec;
	float end_sec;
	float confidence;
	int32_t speaker_tag;
} pv_word_t;

typedef int32_t (*pv_leopard_sample_rate_func)();

int32_t pv_leopard_sample_rate_wrapper(void *f) {
	 return ((pv_leopard_sample_rate_func) f)();
}

typedef char* (*pv_leopard_version_func)();

char* pv_leopard_version_wrapper(void* f) {
	 return ((pv_leopard_version_func) f)();
}

typedef int32_t (*pv_leopard_init_func)(
	const char *access_key,
	const char *model_path,
	bool enable_punctuation_detection,
	bool enable_diarization,
	void **object);

int32_t pv_leopard_init_wrapper(
	void *f,
	const char *access_key,
	const char *model_path,
	bool enable_punctuation_detection,
	bool enable_diarization,
	void **object) {
	return ((pv_leopard_init_func) f)(
		access_key,
		model_path,
		enable_punctuation_detection,
		enable_diarization,
		object);
}

typedef int32_t (*pv_leopard_process_func)(
	void *object,
	const int16_t *pcm,
	int32_t num_samples,
	char **transcript,
	int32_t *num_words,
	pv_word_t **words);

int32_t pv_leopard_process_wrapper(
	void *f,
	void *object,
	const int16_t *pcm,
	int32_t num_samples,
	char **transcript,
	int32_t *num_words,
	pv_word_t **words) {
	return ((pv_leopard_process_func) f)(
		object,
		pcm,
		num_samples,
		transcript,
		num_words,
		words);
}

typedef int32_t (*pv_leopard_process_file_func)(
	void *object,
	const char *audio_path,
	char **transcript,
	int32_t *num_words,
	pv_word_t **words);

int32_t pv_leopard_process_file_wrapper(
	void *f,
	void *object,
	const char *audio_path,
	char **transcript,
	int32_t *num_words,
	pv_word_t **words) {
	return ((pv_leopard_process_file_func) f)(
		object,
		audio_path,
		transcript,
		num_words,
		words);
}

typedef void (*pv_leopard_delete_func)(void *);

void pv_leopard_delete_wrapper(void *f, void *object) {
	return ((pv_leopard_delete_func) f)(object);
}

typedef void (*pv_leopard_transcript_delete_func)(char *);

void pv_leopard_transcript_delete_wrapper(void *f, char *transcript) {
	return ((pv_leopard_transcript_delete_func) f)(transcript);
}

typedef void (*pv_leopard_words_delete_func)(pv_word_t *);

void pv_leopard_words_delete_wrapper(void *f, pv_word_t *words) {
	return ((pv_leopard_words_delete_func) f)(words);
}

typedef void (*pv_set_sdk_func)(const char *);

void pv_set_sdk_wrapper(void *f, const char *sdk) {
	return ((pv_set_sdk_func) f)(sdk);
}

typedef int32_t (*pv_get_error_stack_func)(char ***, int32_t *);

int32_t pv_get_error_stack_wrapper(
	void *f,
	char ***message_stack,
	int32_t *message_stack_depth) {
	return ((pv_get_error_stack_func) f)(message_stack, message_stack_depth);
}

typedef void (*pv_free_error_stack_func)(char **);

void pv_free_error_stack_wrapper(
	void *f,
	char **message_stack) {
	return ((pv_free_error_stack_func) f)(message_stack);
}

*/
import "C"

import (
	"unsafe"
)

type nativeLeopardInterface interface {
	nativeInit(*Leopard)
	nativeProcess(*Leopard, []int)
	nativeProcessFile(*Leopard, string)
	nativeDelete(*Leopard)
	nativeSampleRate()
	nativeVersion()
	nativeGetErrorStack()
}
type nativeLeopardType struct {
	libraryHandle                    unsafe.Pointer
	pv_leopard_init_ptr              unsafe.Pointer
	pv_leopard_process_ptr           unsafe.Pointer
	pv_leopard_process_file_ptr      unsafe.Pointer
	pv_leopard_delete_ptr            unsafe.Pointer
	pv_leopard_transcript_delete_ptr unsafe.Pointer
	pv_leopard_words_delete_ptr      unsafe.Pointer
	pv_leopard_version_ptr           unsafe.Pointer
	pv_sample_rate_ptr               unsafe.Pointer
	pv_set_sdk_ptr                   unsafe.Pointer
	pv_get_error_stack_ptr           unsafe.Pointer
	pv_free_error_stack_ptr          unsafe.Pointer
}

func (nl *nativeLeopardType) nativeInit(leopard *Leopard) (status PvStatus) {
	var (
		accessKeyC                  = C.CString(leopard.AccessKey)
		modelPathC                  = C.CString(leopard.ModelPath)
		libraryPathC                = C.CString(leopard.LibraryPath)
		enableAutomaticPunctuationC = C.bool(leopard.EnableAutomaticPunctuation)
		enableDiarizationC          = C.bool(leopard.EnableDiarization)
	)
	defer C.free(unsafe.Pointer(accessKeyC))
	defer C.free(unsafe.Pointer(modelPathC))
	defer C.free(unsafe.Pointer(libraryPathC))

	nl.libraryHandle = C.open_dl(libraryPathC)
	nl.pv_leopard_init_ptr = C.load_symbol(nl.libraryHandle, C.CString("pv_leopard_init"))
	nl.pv_leopard_process_ptr = C.load_symbol(nl.libraryHandle, C.CString("pv_leopard_process"))
	nl.pv_leopard_process_file_ptr = C.load_symbol(nl.libraryHandle, C.CString("pv_leopard_process_file"))
	nl.pv_leopard_delete_ptr = C.load_symbol(nl.libraryHandle, C.CString("pv_leopard_delete"))
	nl.pv_leopard_transcript_delete_ptr = C.load_symbol(nl.libraryHandle, C.CString("pv_leopard_transcript_delete"))
	nl.pv_leopard_words_delete_ptr = C.load_symbol(nl.libraryHandle, C.CString("pv_leopard_words_delete"))
	nl.pv_leopard_version_ptr = C.load_symbol(nl.libraryHandle, C.CString("pv_leopard_version"))
	nl.pv_sample_rate_ptr = C.load_symbol(nl.libraryHandle, C.CString("pv_sample_rate"))
	nl.pv_set_sdk_ptr = C.load_symbol(nl.libraryHandle, C.CString("pv_set_sdk"))
	nl.pv_get_error_stack_ptr = C.load_symbol(nl.libraryHandle, C.CString("pv_get_error_stack"))
	nl.pv_free_error_stack_ptr = C.load_symbol(nl.libraryHandle, C.CString("pv_free_error_stack"))

	C.pv_set_sdk_wrapper(
		nl.pv_set_sdk_ptr,
		C.CString("go"))

	var ret = C.pv_leopard_init_wrapper(
		nl.pv_leopard_init_ptr,
		accessKeyC,
		modelPathC,
		enableAutomaticPunctuationC,
		enableDiarizationC,
		&leopard.handle)

	return PvStatus(ret)
}

func (nl *nativeLeopardType) nativeDelete(leopard *Leopard) {
	C.pv_leopard_delete_wrapper(nl.pv_leopard_delete_ptr,
		leopard.handle)
}

func (nl *nativeLeopardType) nativeProcess(leopard *Leopard, pcm []int16) (status PvStatus, transcript string, words []LeopardWord) {
	var (
		numWords      C.int32_t
		transcriptPtr *C.char
		wordsPtr      *C.pv_word_t
	)

	var ret = C.pv_leopard_process_wrapper(nl.pv_leopard_process_ptr,
		leopard.handle,
		(*C.int16_t)(unsafe.Pointer(&pcm[0])),
		(C.int32_t)(len(pcm)),
		&transcriptPtr,
		&numWords,
		&wordsPtr)
	if PvStatus(ret) != SUCCESS {
		return PvStatus(ret), "", nil
	}

	transcript = C.GoString(transcriptPtr)
	if wordsPtr != nil {
		cWords := (*[1 << 20]C.pv_word_t)(unsafe.Pointer(wordsPtr))[:numWords]
		for i := 0; i < int(numWords); i++ {
			n := LeopardWord{
				Word:       C.GoString(cWords[i].word),
				StartSec:   float32(cWords[i].start_sec),
				EndSec:     float32(cWords[i].end_sec),
				Confidence: float32(cWords[i].confidence),
				SpeakerTag: int32(cWords[i].speaker_tag),
			}
			words = append(words, n)
		}
	}

	C.pv_leopard_transcript_delete_wrapper(nl.pv_leopard_transcript_delete_ptr, transcriptPtr)
	C.pv_leopard_words_delete_wrapper(nl.pv_leopard_words_delete_ptr, wordsPtr)

	return PvStatus(ret), transcript, words
}

func (nl *nativeLeopardType) nativeProcessFile(leopard *Leopard, audioPath string) (status PvStatus, transcript string, words []LeopardWord) {
	var (
		audioPathC    = C.CString(audioPath)
		numWords      C.int32_t
		transcriptPtr *C.char
		wordsPtr      *C.pv_word_t
	)
	defer C.free(unsafe.Pointer(audioPathC))

	var ret = C.pv_leopard_process_file_wrapper(nl.pv_leopard_process_file_ptr,
		leopard.handle,
		audioPathC,
		&transcriptPtr,
		&numWords,
		&wordsPtr)
	if PvStatus(ret) != SUCCESS {
		return PvStatus(ret), "", nil
	}

	transcript = C.GoString(transcriptPtr)
	if wordsPtr != nil {
		cWords := (*[1 << 20]C.pv_word_t)(unsafe.Pointer(wordsPtr))[:numWords]
		for i := 0; i < int(numWords); i++ {
			n := LeopardWord{
				Word:       C.GoString(cWords[i].word),
				StartSec:   float32(cWords[i].start_sec),
				EndSec:     float32(cWords[i].end_sec),
				Confidence: float32(cWords[i].confidence),
				SpeakerTag: int32(cWords[i].speaker_tag),
			}
			words = append(words, n)
		}
	}

	C.pv_leopard_transcript_delete_wrapper(nl.pv_leopard_transcript_delete_ptr, transcriptPtr)
	C.pv_leopard_words_delete_wrapper(nl.pv_leopard_words_delete_ptr, wordsPtr)

	return PvStatus(ret), transcript, words
}

func (nl *nativeLeopardType) nativeSampleRate() (sampleRate int) {
	return int(C.pv_leopard_sample_rate_wrapper(nl.pv_sample_rate_ptr))
}

func (nl *nativeLeopardType) nativeVersion() (version string) {
	return C.GoString(C.pv_leopard_version_wrapper(nl.pv_leopard_version_ptr))
}

func (nl *nativeLeopardType) nativeGetErrorStack() (status PvStatus, messageStack []string) {
	var messageStackDepthRef C.int32_t
	var messageStackRef **C.char

	var ret = C.pv_get_error_stack_wrapper(
		nl.pv_get_error_stack_ptr,
		&messageStackRef,
		&messageStackDepthRef)

	if PvStatus(ret) != SUCCESS {
		return PvStatus(ret), []string{}
	}

	defer C.pv_free_error_stack_wrapper(
		nl.pv_free_error_stack_ptr,
		messageStackRef)

	messageStackDepth := int(messageStackDepthRef)
	messageStackSlice := (*[1 << 28]*C.char)(unsafe.Pointer(messageStackRef))[:messageStackDepth:messageStackDepth]

	messageStack = make([]string, messageStackDepth)

	for i := 0; i < messageStackDepth; i++ {
		messageStack[i] = C.GoString(messageStackSlice[i])
	}

	return PvStatus(ret), messageStack
}
