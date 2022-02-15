// Copyright 2022 Picovoice Inc.
//
// You may not use this file except in compliance with the license. A copy of the license is
// located in the "LICENSE" file accompanying this source.
//
// Unless required by applicable law or agreed to in writing, software distributed under the
// License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
// express or implied. See the License for the specific language governing permissions and
// limitations under the License.

// Go binding for Leopard Speech-to-Text engine.

// +build windows

package leopard

//#include <stdlib.h>
import "C"

import (
	"unsafe"

	"golang.org/x/sys/windows"
)

// private vars
var (
	lib               = windows.NewLazyDLL(libName)
	init_func         = lib.NewProc("pv_leopard_init")
	process_func      = lib.NewProc("pv_leopard_process")
	process_file_func = lib.NewProc("pv_leopard_process_file")
	sample_rate_func  = lib.NewProc("pv_sample_rate")
	version_func      = lib.NewProc("pv_leopard_version")
	delete_func       = lib.NewProc("pv_leopard_delete")
)

func (np nativeLeopardType) nativeInit(leopard *Leopard) (status PvStatus) {
	var (
		accessKeyC  = C.CString(leopard.AccessKey)
		modelPathC  = C.CString(leopard.ModelPath)
	)
	defer C.free(unsafe.Pointer(accessKeyC))
	defer C.free(unsafe.Pointer(modelPathC))

	ret, _, _ := init_func.Call(
		uintptr(unsafe.Pointer(accessKeyC)),
		uintptr(unsafe.Pointer(modelPathC)),
		uintptr(unsafe.Pointer(&leopard.handle)))

	return PvStatus(ret)
}

func (np nativeLeopardType) nativeDelete(leopard *Leopard) {
	delete_func.Call(leopard.handle)
}

func (np nativeLeopardType) nativeProcess(leopard *Leopard, pcm []int16) (status PvStatus, transcript string) {
	var transcriptPtr uintptr

	ret, _, _ := process_func.Call(
		leopard.handle,
		uintptr(unsafe.Pointer(&pcm[0])),
		uintptr(len(pcm)),
		uintptr(unsafe.Pointer(&transcriptPtr)))

	transcript = C.GoString((*C.char)(unsafe.Pointer(transcriptPtr)))
	C.free(unsafe.Pointer(transcriptPtr))

	return PvStatus(ret), transcript
}

func (np nativeLeopardType) nativeProcessFile(leopard *Leopard, audioPath string) (status PvStatus, transcript string) {
	var (
		transcriptPtr uintptr
		audioPathC = C.CString(audioPath)
	)
	defer C.free(unsafe.Pointer(audioPathC))

	ret, _, _ := process_file_func.Call(
		leopard.handle,
		uintptr(unsafe.Pointer(audioPathC)),
		uintptr(unsafe.Pointer(&transcriptPtr)))

	transcript = C.GoString((*C.char)(unsafe.Pointer(transcriptPtr)))
	C.free(unsafe.Pointer(transcriptPtr))

	return PvStatus(ret), transcript
}

func (np nativeLeopardType) nativeSampleRate() (sampleRate int) {
	ret, _, _ := sample_rate_func.Call()
	return int(ret)
}

func (np nativeLeopardType) nativeVersion() (version string) {
	ret, _, _ := version_func.Call()
	return C.GoString((*C.char)(unsafe.Pointer(ret)))
}
