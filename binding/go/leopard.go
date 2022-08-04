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

import (
	"C"
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)
import "unsafe"

//go:embed embedded
var embeddedFS embed.FS

// PvStatus type
type PvStatus int

// Possible status return codes from the Leopard library
const (
	SUCCESS                  PvStatus = 0
	OUT_OF_MEMORY            PvStatus = 1
	IO_ERROR                 PvStatus = 2
	INVALID_ARGUMENT         PvStatus = 3
	STOP_ITERATION           PvStatus = 4
	KEY_ERROR                PvStatus = 5
	INVALID_STATE            PvStatus = 6
	RUNTIME_ERROR            PvStatus = 7
	ACTIVATION_ERROR         PvStatus = 8
	ACTIVATION_LIMIT_REACHED PvStatus = 9
	ACTIVATION_THROTTLED     PvStatus = 10
	ACTIVATION_REFUSED       PvStatus = 11
)

type LeopardError struct {
	StatusCode PvStatus
	Message    string
}

type leopardExts struct {
	values map[string]struct{}
}

func (e *LeopardError) Error() string {
	return fmt.Sprintf("%s: %s", pvStatusToString(e.StatusCode), e.Message)
}

// Leopard struct
type pvLeopard struct {
	// handle for leopard instance in C
	handle unsafe.Pointer

	// AccessKey obtained from Picovoice Console (https://console.picovoice.ai/).
	AccessKey string

	// Absolute path to the file containing model parameters.
	ModelPath string

	// Absolute path to the Leopard's dynamic library.
	LibraryPath string

	// Flag to enable automatic punctuation insertion.
	EnableAutomaticPunctuation bool
}

type LeopardWord struct {
	// Transcribed word
	Word string

	// Start of word in seconds.
	StartSec float32

	// End of word in seconds.
	EndSec float32

	// Transcription confidence. It is a number within [0, 1].
	Confidence float32
}

type LeopardTranscript struct {
	// Inferred transcription.
	Transcript string

	// Transcribed words and their associated metadata.
	Words []LeopardWord
}

// private vars
var (
	osName, cpu   = getOS()
	extractionDir = filepath.Join(os.TempDir(), "leopard")

	defaultModelFile = extractDefaultModel()
	defaultLibPath   = extractLib()
	nativeLeopard    = nativeLeopardType{}

	validExtensions = getExtensions()
)

var (
	// Audio sample rate accepted by Picovoice.
	SampleRate int

	// Leopard version
	Version string
)

// Returns a Leopard struct with default parameters
func NewLeopard(accessKey string) pvLeopard {
	return pvLeopard{
		AccessKey:                  accessKey,
		ModelPath:                  defaultModelFile,
		LibraryPath:                defaultLibPath,
		EnableAutomaticPunctuation: false,
	}
}

// Init function for Leopard. Must be called before attempting process
func (leopard *pvLeopard) Init() error {
	if leopard.AccessKey == "" {
		return &LeopardError{
			INVALID_ARGUMENT,
			"No AccessKey provided to Leopard"}
	}

	if leopard.ModelPath == "" {
		leopard.ModelPath = defaultModelFile
	}

	if leopard.LibraryPath == "" {
		leopard.LibraryPath = defaultLibPath
	}

	if _, err := os.Stat(leopard.LibraryPath); os.IsNotExist(err) {
		return &LeopardError{
			INVALID_ARGUMENT,
			fmt.Sprintf("Specified library file could not be found at %s", leopard.LibraryPath)}
	}

	if _, err := os.Stat(leopard.ModelPath); os.IsNotExist(err) {
		return &LeopardError{
			INVALID_ARGUMENT,
			fmt.Sprintf("Specified model file could not be found at %s", leopard.ModelPath)}
	}

	ret := nativeLeopard.nativeInit(leopard)
	if PvStatus(ret) != SUCCESS {
		return &LeopardError{
			PvStatus(ret),
			"Leopard init failed."}
	}

	SampleRate = nativeLeopard.nativeSampleRate()
	Version = nativeLeopard.nativeVersion()

	return nil
}

// Releases resources acquired by Leopard.
func (leopard *pvLeopard) Delete() error {
	if leopard.handle == nil {
		return &LeopardError{
			INVALID_STATE,
			"Leopard has not been initialized or has already been deleted"}
	}

	nativeLeopard.nativeDelete(leopard)
	return nil
}

// Processes a given audio data and returns its transcription.
// The audio needs to have a sample rate equal to `.SampleRate` and be 16-bit
// linearly-encoded. This function operates on single-channel audio. If you wish
// to process data in a different sample rate or format consider using `ProcessFile`.
// Returns the inferred transcription.
func (leopard *pvLeopard) Process(pcm []int16) (LeopardTranscript, error) {
	emptyResult := LeopardTranscript{
		Transcript: "",
		Words:      nil,
	}
	if leopard.handle == nil {
		return emptyResult, &LeopardError{
			INVALID_STATE,
			"Leopard has not been initialized or has already been deleted"}
	}

	if len(pcm) == 0 {
		return emptyResult, &LeopardError{
			INVALID_ARGUMENT,
			"Audio data must not be empty"}
	}

	ret, result := nativeLeopard.nativeProcess(leopard, pcm)
	if PvStatus(ret) != SUCCESS {
		return emptyResult, &LeopardError{
			PvStatus(ret),
			"Leopard process failed."}
	}

	return result, nil
}

// Processes a given audio file and returns its transcription.
// The supported formats are: `3gp (AMR)`, `FLAC`, `MP3`, `MP4/m4a (AAC)`, `Ogg`, `WAV`, `WebM`.
// Returns the inferred transcription.
func (leopard *pvLeopard) ProcessFile(audioPath string) (LeopardTranscript, error) {
	emptyResult := LeopardTranscript{
		Transcript: "",
		Words:      nil,
	}
	if leopard.handle == nil {
		return emptyResult, &LeopardError{
			INVALID_STATE,
			"Leopard has not been initialized or has already been deleted"}
	}

	if _, err := os.Stat(audioPath); os.IsNotExist(err) {
		return emptyResult, &LeopardError{
			INVALID_ARGUMENT,
			fmt.Sprintf("Specified file could not be found at '%s'", audioPath)}
	}

	ret, result := nativeLeopard.nativeProcessFile(leopard, audioPath)
	if ret != SUCCESS {
		if ret == INVALID_ARGUMENT {
			fileExtension := filepath.Ext(audioPath)
			if !validExtensions.includes(fileExtension) {
				return emptyResult, &LeopardError{
					INVALID_ARGUMENT,
					fmt.Sprintf("Specified file with extension '%s' is not supported", fileExtension)}
			}
		}
		return emptyResult, &LeopardError{
			PvStatus(ret),
			"Leopard process failed."}
	}

	return result, nil
}

func pvStatusToString(status PvStatus) string {
	switch status {
	case SUCCESS:
		return "SUCCESS"
	case OUT_OF_MEMORY:
		return "OUT_OF_MEMORY"
	case IO_ERROR:
		return "IO_ERROR"
	case INVALID_ARGUMENT:
		return "INVALID_ARGUMENT"
	case STOP_ITERATION:
		return "STOP_ITERATION"
	case KEY_ERROR:
		return "KEY_ERROR"
	case INVALID_STATE:
		return "INVALID_STATE"
	case RUNTIME_ERROR:
		return "RUNTIME_ERROR"
	case ACTIVATION_ERROR:
		return "ACTIVATION_ERROR"
	case ACTIVATION_LIMIT_REACHED:
		return "ACTIVATION_LIMIT_REACHED"
	case ACTIVATION_THROTTLED:
		return "ACTIVATION_THROTTLED"
	case ACTIVATION_REFUSED:
		return "ACTIVATION_REFUSED"
	default:
		return fmt.Sprintf("Unknown error code: %d", status)
	}
}

func (le *leopardExts) includes(extension string) bool {
	_, ok := le.values[extension]
	return ok
}

func getExtensions() leopardExts {
	extensions := []string{
		"3gp",
		"flac",
		"m4a",
		"mp3",
		"mp4",
		"ogg",
		"opus",
		"vorbis",
		"wav",
		"webm",
	}
	exts := make(map[string]struct{})
	for _, ext := range extensions {
		exts[ext] = struct{}{}
	}
	return leopardExts{values: exts}
}

func getOS() (string, string) {
	switch os := runtime.GOOS; os {
	case "darwin":
		return "mac", getMacArch()
	case "linux":
		osName, cpu := getLinuxDetails()
		return osName, cpu
	case "windows":
		return "windows", "amd64"
	default:
		log.Fatalf("%s is not a supported OS", os)
		return "", ""
	}
}

func getMacArch() string {
	if runtime.GOARCH == "arm64" {
		return "arm64"
	} else {
		return "x86_64"
	}
}

func getLinuxDetails() (string, string) {
	var archInfo = ""

	if runtime.GOARCH == "amd64" {
		return "linux", "x86_64"
	} else if runtime.GOARCH == "arm64" {
		archInfo = "-aarch64"
	}

	cmd := exec.Command("cat", "/proc/cpuinfo")
	cpuInfo, err := cmd.Output()

	if err != nil {
		log.Fatalf("Failed to get CPU details: %s", err.Error())
	}

	var cpuPart = ""
	for _, line := range strings.Split(string(cpuInfo), "\n") {
		if strings.Contains(line, "CPU part") {
			split := strings.Split(line, " ")
			cpuPart = strings.ToLower(split[len(split)-1])
			break
		}
	}

	switch cpuPart {
	case "0xd03":
		return "raspberry-pi", "cortex-a53" + archInfo
	case "0xd07":
		return "jetson", "cortex-a57" + archInfo
	case "0xd08":
		return "raspberry-pi", "cortex-a72" + archInfo
	default:
		log.Fatalf("Unsupported CPU:\n%s", cpuPart)
		return "", ""
	}
}

func extractDefaultModel() string {
	modelPath := "embedded/lib/common/leopard_params.pv"
	return extractFile(modelPath, extractionDir)
}

func extractLib() string {
	var libPath string
	switch os := runtime.GOOS; os {
	case "darwin":
		libPath = fmt.Sprintf("embedded/lib/%s/%s/libpv_leopard.dylib", osName, cpu)
	case "linux":
		if cpu == "" {
			libPath = fmt.Sprintf("embedded/lib/%s/libpv_leopard.so", osName)
		} else {
			libPath = fmt.Sprintf("embedded/lib/%s/%s/libpv_leopard.so", osName, cpu)
		}
	case "windows":
		libPath = fmt.Sprintf("embedded/lib/%s/amd64/libpv_leopard.dll", osName)
	default:
		log.Fatalf("%s is not a supported OS", os)
	}

	return extractFile(libPath, extractionDir)
}

func extractFile(srcFile string, dstDir string) string {
	bytes, readErr := embeddedFS.ReadFile(srcFile)
	if readErr != nil {
		log.Fatalf("%v", readErr)
	}

	srcHash := sha256sumBytes(bytes)
	hashedDstDir := filepath.Join(dstDir, srcHash)
	extractedFilepath := filepath.Join(hashedDstDir, srcFile)

	if _, err := os.Stat(extractedFilepath); errors.Is(err, os.ErrNotExist) {
		mkErr := os.MkdirAll(filepath.Dir(extractedFilepath), 0764)
		if mkErr != nil {
			log.Fatalf("%v", mkErr)
		}

		writeErr := ioutil.WriteFile(extractedFilepath, bytes, 0764)
		if writeErr != nil {
			log.Fatalf("%v", writeErr)
		}
	}

	return extractedFilepath
}

func sha256sumBytes(bytes []byte) string {
	sum := sha256.Sum256(bytes)
	return hex.EncodeToString(sum[:])
}
