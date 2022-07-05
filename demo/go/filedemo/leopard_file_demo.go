// Copyright 2022 Picovoice Inc.
//
// You may not use this file except in compliance with the license. A copy of the license is
// located in the "LICENSE" file accompanying this source.
//
// Unless required by applicable law or agreed to in writing, software distributed under the
// License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
// express or implied. See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"flag"
	"log"
	"os"
	"path/filepath"

	leopard "github.com/Picovoice/leopard/binding/go"
)

func main() {
	inputAudioPathArg := flag.String("input_audio_path", "", "Path to input audio file (mono, valid: `FLAC`, `MP3`, `Ogg`, `Opus`, `Vorbis`, `WAV`, and `WebM`, 16-bit, 16kHz)")
	accessKeyArg := flag.String("access_key", "", "AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)")
	libraryPathArg := flag.String("library_path", "", "Path to Leopard's dynamic library file")
	modelPathArg := flag.String("model_path", "", "Path to Leopard model file")
	flag.Parse()

	// validate input audio
	if *inputAudioPathArg == "" {
		log.Fatalln("No input audio file provided.")
	}
	inputAudioPath, _ := filepath.Abs(*inputAudioPathArg)
	f, err := os.Open(inputAudioPath)
	if err != nil {
		log.Fatalf("Unable to find or open input audio at %s\n", inputAudioPath)
	}
	defer f.Close()

	l := leopard.Leopard{
		AccessKey: *accessKeyArg,
	}
	defer l.Delete()

	// validate library path
	if *libraryPathArg != "" {
		libraryPath, _ := filepath.Abs(*libraryPathArg)
		if _, err := os.Stat(libraryPath); os.IsNotExist(err) {
			log.Fatalf("Could not find library file at %s", libraryPath)
		}

		l.LibraryPath = libraryPath
	}

	// validate model
	if *modelPathArg != "" {
		modelPath, _ := filepath.Abs(*modelPathArg)
		if _, err := os.Stat(modelPath); os.IsNotExist(err) {
			log.Fatalf("Could not find model file at %s", modelPath)
		}

		l.ModelPath = modelPath
	}

	err = l.Init()
	if err != nil {
		log.Fatalf("Failed to initialize: %v\n", err)
	}

	log.Println("Processing audio file...")

	res, err := l.ProcessFile(inputAudioPath)
	if err != nil {
		log.Fatalf("Error processing: %v\n", err)
	}

	log.Println(res)
}
