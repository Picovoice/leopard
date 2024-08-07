// Copyright 2022-2023 Picovoice Inc.
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
	"fmt"
	"log"
	"os"
	"path/filepath"

	leopard "github.com/Picovoice/leopard/binding/go/v2"
)

func main() {
	accessKeyArg := flag.String("access_key", "", "AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)")
	modelPathArg := flag.String("model_path", "", "Path to Leopard model file")
	libraryPathArg := flag.String("library_path", "", "Path to Leopard's dynamic library file")
	disableAutomaticPunctuationArg := flag.Bool("disable_automatic_punctuation", false, "Disable automatic punctuation")
	disableSpeakerDiarizationArg := flag.Bool("disable_speaker_diarization", false, "Disable speaker diarization")
	verboseArg := flag.Bool("verbose", false, "Enable verbose logging")
	inputAudioPathArg := flag.String("input_audio_path", "", "Path to input audio file (mono, 16-bit, valid formats: 3gp (AMR), FLAC, MP3, MP4/m4a (AAC), Ogg, WAV, WebM)")

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

	l := leopard.NewLeopard(*accessKeyArg)
	l.EnableAutomaticPunctuation = !*disableAutomaticPunctuationArg
	l.EnableDiarization = !*disableSpeakerDiarizationArg

	defer func() {
		err := l.Delete()
		if err != nil {
			log.Fatalf("Failed to release resources: %s", err)
		}
	}()

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

	transcript, words, err := l.ProcessFile(inputAudioPath)
	if err != nil {
		log.Fatalf("Error processing: %v\n", err)
	}

	fmt.Println(transcript)
	if *verboseArg {
		fmt.Printf("|%10s | %10s | %10s | %10s | %10s|\n", "Word", "Start (s)", "End (s)", "Confidence", "Speaker Tag")
		for _, word := range words {
			fmt.Printf("|%10s | %10.2f | %10.2f | %10.2f | %11d|\n", word.Word, word.StartSec, word.EndSec, word.Confidence, word.SpeakerTag)
		}
	}
}
