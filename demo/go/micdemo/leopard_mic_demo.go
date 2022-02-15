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
	"os/signal"
	"path/filepath"

	leopard "github.com/Picovoice/leopard/binding/go"
	pvrecorder "github.com/Picovoice/pvrecorder/sdk/go"
	"github.com/go-audio/wav"
)

func main() {
	accessKeyArg := flag.String("access_key", "", "AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)")
	modelPathArg := flag.String("model_path", "", "Path to Leopard model file")
	audioDeviceIndex := flag.Int("audio_device_index", -1, "Index of capture device to use.")
	outputPathArg := flag.String("output_path", "", "Path to recorded audio (for debugging)")
	showAudioDevices := flag.Bool("show_audio_devices", false, "Display all available capture devices")
	flag.Parse()

	if *showAudioDevices {
		printAudioDevices()
		return
	}

	var outputWav *wav.Encoder
	if *outputPathArg != "" {
		outputFilePath, _ := filepath.Abs(*outputPathArg)
		outputFile, err := os.Create(outputFilePath)
		if err != nil {
			log.Fatalf("Failed to create output audio at path %s", outputFilePath)
		}
		defer outputFile.Close()

		outputWav = wav.NewEncoder(outputFile, leopard.SampleRate, 16, 1, 1)
		defer outputWav.Close()
	}

	l := leopard.Leopard{
		AccessKey: *accessKeyArg,
		ModelPath: *modelPathArg,
	}

	err := l.Init()
	if err != nil {
		log.Fatal(err)
	}
	defer l.Delete()

	frameLength := 512
	recorder := pvrecorder.PvRecorder{
		DeviceIndex:    *audioDeviceIndex,
		FrameLength: 	frameLength,
		BufferSizeMSec: 1000,
		LogOverflow:    0,
	}

	if err := recorder.Init(); err != nil {
		log.Fatalf("Error: %s.\n", err.Error())
	}
	defer recorder.Delete()

	log.Printf("Using device: %s", recorder.GetSelectedDevice())

	if err := recorder.Start(); err != nil {
		log.Fatalf("Error: %s.\n", err.Error())
	}

	log.Printf("Recording...")

	signalCh := make(chan os.Signal, 1)
	waitCh := make(chan struct{})
	signal.Notify(signalCh, os.Interrupt)

	go func() {
		<-signalCh
		close(waitCh)
	}()

	audioData := make([]int16, frameLength)

waitLoop:
	for {
		select {
		case <-waitCh:
			log.Println("Transcribing audio...")
			break waitLoop
		default:
			pcm, err := recorder.Read()
			if err != nil {
				log.Fatalf("Error: %v.\n", err)
			}
			audioData = append(audioData, pcm...)
		}
	}
			
	// write to debug file
	if outputWav != nil {
		for outputBufIndex := range audioData {
			outputWav.WriteFrame(audioData[outputBufIndex])
		}
	}

	res, err := l.Process(audioData)
	if err != nil {
		log.Fatalf("Error processing: %v\n", err)
	}

	log.Println(res)
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
