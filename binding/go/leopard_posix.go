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

//go:build linux || darwin
// +build linux darwin

package leopard

/*
#cgo LDFLAGS: -ldl
#include "leopard.h"
*/
import "C"

import (
	"unsafe"
)

// private vars
var (
	lib = C.dlopen(C.CString(libName), C.RTLD_NOW)

	pv_leopard_init_ptr         = C.dlsym(lib, C.CString("pv_leopard_init"))
	pv_leopard_process_ptr      = C.dlsym(lib, C.CString("pv_leopard_process"))
	pv_leopard_process_file_ptr = C.dlsym(lib, C.CString("pv_leopard_process_file"))
	pv_leopard_delete_ptr       = C.dlsym(lib, C.CString("pv_leopard_delete"))
	pv_leopard_version_ptr      = C.dlsym(lib, C.CString("pv_leopard_version"))
	pv_sample_rate_ptr          = C.dlsym(lib, C.CString("pv_sample_rate"))
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
		audioPathC = C.CString(audioPath)
	)

	var ret = C.pv_leopard_process_file_wrapper(pv_leopard_process_file_ptr,
		unsafe.Pointer(leopard.handle),
		audioPathC,
		(**C.char)(unsafe.Pointer(&transcriptPtr)))

	transcript = C.GoString((*C.char)(unsafe.Pointer(transcriptPtr)))
	C.free(unsafe.Pointer(transcriptPtr))
	defer C.free(unsafe.Pointer(audioPathC))

	return PvStatus(ret), transcript
}

func (nl nativeLeopardType) nativeSampleRate() (sampleRate int) {
	return int(C.pv_leopard_sample_rate_wrapper(pv_sample_rate_ptr))
}

func (nl nativeLeopardType) nativeVersion() (version string) {
	return C.GoString(C.pv_leopard_version_wrapper(pv_leopard_version_ptr))
}
