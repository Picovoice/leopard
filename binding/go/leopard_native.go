// Copyright 2022 Picovoice Inc.
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

import "C"
import (
	"unsafe"
)

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
    void **object);

int32_t pv_leopard_init_wrapper(
    void *f,
    const char *access_key,
    const char *model_path,
    bool enable_punctuation_detection,
    void **object) {
    return ((pv_leopard_init_func) f)(
        access_key,
        model_path,
        enable_punctuation_detection,
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
*/
import "C"

type nativeLeopardInterface interface {
	nativeInit(*pvLeopard)
	nativeProcess(*pvLeopard, []int)
	nativeProcessFile(*pvLeopard, string)
	nativeDelete(*pvLeopard)
	nativeSampleRate()
	nativeVersion()
}
type nativeLeopardType struct {
	libraryHandle               unsafe.Pointer
	pv_leopard_init_ptr         unsafe.Pointer
	pv_leopard_process_ptr      unsafe.Pointer
	pv_leopard_process_file_ptr unsafe.Pointer
	pv_leopard_delete_ptr       unsafe.Pointer
	pv_leopard_version_ptr      unsafe.Pointer
	pv_sample_rate_ptr          unsafe.Pointer
}

func (nl *nativeLeopardType) nativeInit(leopard *pvLeopard) (status PvStatus) {
	var (
		accessKeyC                  = C.CString(leopard.AccessKey)
		modelPathC                  = C.CString(leopard.ModelPath)
		libraryPathC                = C.CString(leopard.LibraryPath)
		enableAutomaticPunctuationC = C.bool(leopard.EnableAutomaticPunctuation)
	)
	defer C.free(unsafe.Pointer(accessKeyC))
	defer C.free(unsafe.Pointer(modelPathC))
	defer C.free(unsafe.Pointer(libraryPathC))

	nl.libraryHandle = C.open_dl(libraryPathC)
	nl.pv_leopard_init_ptr = C.load_symbol(nl.libraryHandle, C.CString("pv_leopard_init"))
	nl.pv_leopard_process_ptr = C.load_symbol(nl.libraryHandle, C.CString("pv_leopard_process"))
	nl.pv_leopard_process_file_ptr = C.load_symbol(nl.libraryHandle, C.CString("pv_leopard_process_file"))
	nl.pv_leopard_delete_ptr = C.load_symbol(nl.libraryHandle, C.CString("pv_leopard_delete"))
	nl.pv_leopard_version_ptr = C.load_symbol(nl.libraryHandle, C.CString("pv_leopard_version"))
	nl.pv_sample_rate_ptr = C.load_symbol(nl.libraryHandle, C.CString("pv_sample_rate"))

	var ret = C.pv_leopard_init_wrapper(
		nl.pv_leopard_init_ptr,
		accessKeyC,
		modelPathC,
		enableAutomaticPunctuationC,
		&leopard.handle)

	return PvStatus(ret)
}

func (nl *nativeLeopardType) nativeDelete(leopard *pvLeopard) {
	C.pv_leopard_delete_wrapper(nl.pv_leopard_delete_ptr,
		leopard.handle)
}

func (nl *nativeLeopardType) nativeProcess(leopard *pvLeopard, pcm []int16) (status PvStatus, transcript string, words []LeopardWord) {
	var (
		numWords      int32
		transcriptPtr unsafe.Pointer
		wordsPtr      unsafe.Pointer
	)

	var ret = C.pv_leopard_process_wrapper(nl.pv_leopard_process_ptr,
		leopard.handle,
		(*C.int16_t)(unsafe.Pointer(&pcm[0])),
		(C.int32_t)(len(pcm)),
		(**C.char)(unsafe.Pointer(&transcriptPtr)),
		(*C.int32_t)(unsafe.Pointer(&numWords)),
		(**C.pv_word_t)(unsafe.Pointer(&wordsPtr)))

	transcript = C.GoString((*C.char)(transcriptPtr))
	cWords := (*[1 << 20]C.pv_word_t)(wordsPtr)[:numWords]
	for i := 0; i < int(numWords); i++ {
		n := LeopardWord{
			Word:       C.GoString(cWords[i].word),
			StartSec:   float32(cWords[i].start_sec),
			EndSec:     float32(cWords[i].end_sec),
			Confidence: float32(cWords[i].confidence),
		}
		words = append(words, n)
	}

	C.free(transcriptPtr)
	C.free(wordsPtr)

	return PvStatus(ret), transcript, words
}

func (nl *nativeLeopardType) nativeProcessFile(leopard *pvLeopard, audioPath string) (status PvStatus, transcript string, words []LeopardWord) {
	var (
		audioPathC    = C.CString(audioPath)
		numWords      int32
		transcriptPtr unsafe.Pointer
		wordsPtr      unsafe.Pointer
	)
	defer C.free(unsafe.Pointer(audioPathC))

	var ret = C.pv_leopard_process_file_wrapper(nl.pv_leopard_process_file_ptr,
		leopard.handle,
		audioPathC,
		(**C.char)(unsafe.Pointer(&transcriptPtr)),
		(*C.int32_t)(unsafe.Pointer(&numWords)),
		(**C.pv_word_t)(unsafe.Pointer(&wordsPtr)))

	transcript = C.GoString((*C.char)(transcriptPtr))
	cWords := (*[1 << 20]C.pv_word_t)(wordsPtr)[:numWords]
	for i := 0; i < int(numWords); i++ {
		n := LeopardWord{
			Word:       C.GoString(cWords[i].word),
			StartSec:   float32(cWords[i].start_sec),
			EndSec:     float32(cWords[i].end_sec),
			Confidence: float32(cWords[i].confidence),
		}
		words = append(words, n)
	}

	C.free(transcriptPtr)
	C.free(wordsPtr)

	return PvStatus(ret), transcript, words
}

func (nl *nativeLeopardType) nativeSampleRate() (sampleRate int) {
	return int(C.pv_leopard_sample_rate_wrapper(nl.pv_sample_rate_ptr))
}

func (nl *nativeLeopardType) nativeVersion() (version string) {
	return C.GoString(C.pv_leopard_version_wrapper(nl.pv_leopard_version_ptr))
}
