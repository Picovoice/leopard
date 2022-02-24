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

/*
#cgo linux LDFLAGS: -ldl
#cgo darwin LDFLAGS: -ldl

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
	void **object);

int32_t pv_leopard_init_wrapper(
	void *f,
	const char *access_key,
	const char *model_path,
	void **object) {
	return ((pv_leopard_init_func) f)(
		access_key,
		model_path,
		object);
}

typedef int32_t (*pv_leopard_process_func)(
	void *object,
	const int16_t *pcm,
	int32_t num_samples,
	char **transcript);

int32_t pv_leopard_process_wrapper(
	void *f,
	void *object,
	const int16_t *pcm,
	int32_t num_samples,
	char **transcript) {
	return ((pv_leopard_process_func) f)(
		object,
		pcm,
		num_samples,
		transcript);
}

typedef int32_t (*pv_leopard_process_file_func)(
	void *object,
	const char *audio_path,
	char **transcript);

int32_t pv_leopard_process_file_wrapper(
	void *f,
	void *object,
	const char *audio_path,
	char **transcript) {
	return ((pv_leopard_process_file_func) f)(
		object,
		audio_path,
		transcript);
}

typedef void (*pv_leopard_delete_func)(void *);

void pv_leopard_delete_wrapper(void *f, void *object) {
	return ((pv_leopard_delete_func) f)(object);
}
*/
import "C"

import (
	"unsafe"
)

// private vars
var (
	lib = C.open_dl(C.CString(libName))

	pv_leopard_init_ptr         = C.load_symbol(lib, C.CString("pv_leopard_init"))
	pv_leopard_process_ptr      = C.load_symbol(lib, C.CString("pv_leopard_process"))
	pv_leopard_process_file_ptr = C.load_symbol(lib, C.CString("pv_leopard_process_file"))
	pv_leopard_delete_ptr       = C.load_symbol(lib, C.CString("pv_leopard_delete"))
	pv_leopard_version_ptr      = C.load_symbol(lib, C.CString("pv_leopard_version"))
	pv_sample_rate_ptr          = C.load_symbol(lib, C.CString("pv_sample_rate"))
)

func (nl nativeLeopardType) nativeInit(leopard *Leopard) (status PvStatus) {
	var (
		accessKeyC = C.CString(leopard.AccessKey)
		modelPathC = C.CString(leopard.ModelPath)
		ptrC       = make([]unsafe.Pointer, 1)
	)
	defer C.free(unsafe.Pointer(accessKeyC))
	defer C.free(unsafe.Pointer(modelPathC))

	var ret = C.pv_leopard_init_wrapper(
		pv_leopard_init_ptr,
		accessKeyC,
		modelPathC,
		&ptrC[0])

	leopard.handle = uintptr(ptrC[0])
	return PvStatus(ret)
}

func (nl nativeLeopardType) nativeDelete(leopard *Leopard) {
	C.pv_leopard_delete_wrapper(pv_leopard_delete_ptr,
		unsafe.Pointer(leopard.handle))
}

func (nl nativeLeopardType) nativeProcess(leopard *Leopard, pcm []int16) (status PvStatus, transcript string) {
	var transcriptPtr uintptr

	var ret = C.pv_leopard_process_wrapper(pv_leopard_process_ptr,
		unsafe.Pointer(leopard.handle),
		(*C.int16_t)(unsafe.Pointer(&pcm[0])),
		(C.int32_t)(len(pcm)),
		(**C.char)(unsafe.Pointer(&transcriptPtr)))

	transcript = C.GoString((*C.char)(unsafe.Pointer(transcriptPtr)))
	C.free(unsafe.Pointer(transcriptPtr))

	return PvStatus(ret), transcript
}

func (nl nativeLeopardType) nativeProcessFile(leopard *Leopard, audioPath string) (status PvStatus, transcript string) {
	var (
		transcriptPtr uintptr
		audioPathC    = C.CString(audioPath)
	)
	defer C.free(unsafe.Pointer(audioPathC))

	var ret = C.pv_leopard_process_file_wrapper(pv_leopard_process_file_ptr,
		unsafe.Pointer(leopard.handle),
		audioPathC,
		(**C.char)(unsafe.Pointer(&transcriptPtr)))

	transcript = C.GoString((*C.char)(unsafe.Pointer(transcriptPtr)))
	C.free(unsafe.Pointer(transcriptPtr))

	return PvStatus(ret), transcript
}

func (nl nativeLeopardType) nativeSampleRate() (sampleRate int) {
	return int(C.pv_leopard_sample_rate_wrapper(pv_sample_rate_ptr))
}

func (nl nativeLeopardType) nativeVersion() (version string) {
	return C.GoString(C.pv_leopard_version_wrapper(pv_leopard_version_ptr))
}
