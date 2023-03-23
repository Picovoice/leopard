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
	"bufio"
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"

	leopard "github.com/Picovoice/leopard/binding/go"
	pvrecorder "github.com/Picovoice/pvrecorder/sdk/go"
)

func readFrames(recorder *pvrecorder.PvRecorder, data *[]int16, stopCh chan struct{}, stoppedCh chan struct{}) {
	for {
		select {
		case <-stopCh:
			close(stoppedCh)
			return
		default:
			pcm, err := recorder.Read()
			if err != nil {
				log.Fatalf("Error: %v.\n", err)
			}
			*data = append(*data, pcm...)
		}
	}
}

func main() {
	accessKeyArg := flag.String("access_key", "", "AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)")
	modelPathArg := flag.String("model_path", "", "Path to Leopard model file")
	libraryPathArg := flag.String("library_path", "", "Path to Leopard's dynamic library file")
	disableAutomaticPunctuationArg := flag.Bool("disable_automatic_punctuation", false, "Disable automatic punctuation")
	verboseArg := flag.Bool("verbose", false, "Enable verbose logging")
	audioDeviceIndex := flag.Int("audio_device_index", -1, "Index of capture device to use.")
	showAudioDevices := flag.Bool("show_audio_devices", false, "Display all available capture devices")
	flag.Parse()

	if *showAudioDevices {
		printAudioDevices()
		return
	}

	l := leopard.NewLeopard(*accessKeyArg)
	l.EnableAutomaticPunctuation = !*disableAutomaticPunctuationArg

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

	err := l.Init()
	if err != nil {
		log.Fatal(err)
	}

	frameLength := 512
	recorder := pvrecorder.PvRecorder{
		DeviceIndex:    *audioDeviceIndex,
		FrameLength:    frameLength,
		BufferSizeMSec: 1000,
		LogOverflow:    0,
	}

	if err := recorder.Init(); err != nil {
		log.Fatalf("Error: %s.\n", err.Error())
	}

	log.Printf("Using device: %s", recorder.GetSelectedDevice())

	if err := recorder.Start(); err != nil {
		log.Fatalf("Error: %s.\n", err.Error())
	}

	fmt.Printf(">>> Press 'CTRL+C' to exit: \n")

	signalCh := make(chan os.Signal, 1)
	signal.Notify(signalCh, os.Interrupt)

	go func() {
		<-signalCh
		fmt.Println()
		os.Exit(func() int {
			recorder.Delete()
			err := l.Delete()
			if err != nil {
				log.Fatalf("Failed to release resources: %s", err)
			}
			return 0
		}())
	}()

	reader := bufio.NewReader(os.Stdin)
	recording := false

	var audioData []int16
	var stopCh chan struct{}
	var stoppedCh chan struct{}

	for {
		if recording {
			fmt.Print(">>> Recording ... Press 'ENTER' to stop: ")
			_, err := reader.ReadString('\n')
			if err != nil {
				log.Fatalf("Error: %v.\n", err)
			}
			recording = false
			close(stopCh)
			<-stoppedCh

			transcript, words, err := l.Process(audioData)
			if err != nil {
				log.Fatalf("Error processing: %v\n", err)
			}

			fmt.Printf("%s\n\n", transcript)
			if *verboseArg {
				fmt.Printf("|%10s | %15s | %15s | %10s|\n", "word", "Start in Sec", "End in Sec", "Confidence")
				for _, word := range words {
					fmt.Printf("|%10s | %15.2f | %15.2f | %10.2f|\n", word.Word, word.StartSec, word.EndSec, word.Confidence)
				}
			}
		} else {
			fmt.Print(">>> Press 'ENTER' to start: ")
			_, err := reader.ReadString('\n')
			if err != nil {
				log.Fatalf("Error: %v.\n", err)
			}
			audioData = make([]int16, frameLength)
			stopCh = make(chan struct{})
			stoppedCh = make(chan struct{})
			recording = true
			go readFrames(&recorder, &audioData, stopCh, stoppedCh)
		}
	}
}

func printAudioDevices() {
	if devices, err := pvrecorder.GetAudioDevices(); err != nil {
		log.Fatalf("Error: %s.\n", err.Error())
	} else {
		for i, device := range devices {
			log.Printf("index: %d, device name: %s\n", i, device)
		}
	}
}
