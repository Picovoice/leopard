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

import (
	"encoding/binary"
	"encoding/json"
	"flag"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"

	"github.com/agnivade/levenshtein"
)

type TestParameters struct {
	language                   string
	testAudioFile              string
	transcript                 string
	errorRate                  float32
	enableAutomaticPunctuation bool
}

var (
	testAccessKey         string
	leopard               Leopard
	processTestParameters []TestParameters
)

func TestMain(m *testing.M) {

	flag.StringVar(&testAccessKey, "access_key", "", "AccessKey for testing")
	flag.Parse()

	processTestParameters = loadTestData()
	os.Exit(m.Run())
}

func appendLanguage(s string, language string) string {
	if language == "en" {
		return s
	} else {
		return s + "_" + language
	}
}
func loadTestData() []TestParameters {

	content, err := ioutil.ReadFile("../../resources/.test/test_data.json")
	if err != nil {
		log.Fatalf("Could not read test data json: %v", err)
	}

	var testData struct {
		Tests struct {
			Parameters []struct {
				Language     string   `json:"language"`
				AudioFile    string   `json:"audio_file"`
				Transcript   string   `json:"transcript"`
				Punctuations []string `json:"punctuations"`
				ErrorRate    float32  `json:"error_rate"`
			} `json:"parameters"`
		} `json:"tests"`
	}
	err = json.Unmarshal(content, &testData)
	if err != nil {
		log.Fatalf("Could not decode test data json: %v", err)
	}

	for _, x := range testData.Tests.Parameters {
		testCaseWithPunctuation := TestParameters{
			language:                   x.Language,
			testAudioFile:              x.AudioFile,
			transcript:                 x.Transcript,
			enableAutomaticPunctuation: true,
			errorRate:                  x.ErrorRate,
		}
		processTestParameters = append(processTestParameters, testCaseWithPunctuation)

		transcriptWithoutPunctuation := x.Transcript
		for _, p := range x.Punctuations {
			transcriptWithoutPunctuation = strings.ReplaceAll(transcriptWithoutPunctuation, p, "")
		}
		testCaseWithoutPunctuation := TestParameters{
			language:                   x.Language,
			testAudioFile:              x.AudioFile,
			transcript:                 transcriptWithoutPunctuation,
			enableAutomaticPunctuation: false,
			errorRate:                  x.ErrorRate,
		}
		processTestParameters = append(processTestParameters, testCaseWithoutPunctuation)
	}

	return processTestParameters
}

func validateMetadata(t *testing.T, transcript string, words []LeopardWord, audioLength float32) {
	transcriptUpperCase := strings.ToUpper(transcript)
	for i := range words {
		wordUpperCase := strings.ToUpper(words[i].Word)
		if !strings.Contains(transcriptUpperCase, wordUpperCase) {
			t.Fatalf("Word `%s` was not in transcript `%s`", wordUpperCase, transcriptUpperCase)
		}
		if words[i].StartSec <= 0 {
			t.Fatalf("Word %d started at %f", i, words[i].StartSec)
		}
		if words[i].StartSec > words[i].EndSec {
			t.Fatalf("Word %d had a start time of %f, but and end time of %f", i, words[i].StartSec, words[i].EndSec)
		}
		if i < len(words)-1 {
			if words[i].EndSec > words[i+1].StartSec {
				t.Fatalf("Word %d had an end time of %f, next word had a start time of %f", i, words[i].EndSec, words[i+1].StartSec)
			}
		} else {
			if words[i].EndSec > audioLength {
				t.Fatalf("Word %d had an end time of %f, audio length is %f", i, words[i].EndSec, audioLength)
			}
		}

		if words[i].Confidence < 0 || words[i].Confidence > 1 {
			t.Fatalf("Word %d had an invalid confidence value of %f", i, words[i].Confidence)
		}
	}
}

func TestVersion(t *testing.T) {
	leopard = NewLeopard(testAccessKey)
	leopard.EnableAutomaticPunctuation = true
	err := leopard.Init()
	if err != nil {
		log.Fatalf("Failed to init leopard with: %v", err)
	}
	defer leopard.Delete()

	if reflect.TypeOf(Version).Name() != "string" {
		t.Fatal("Unexpected version format.")
	}
	if Version == "" {
		t.Fatal("Failed to get version.")
	}
}

func runProcessTestCase(
	t *testing.T,
	language string,
	testAudioFile string,
	referenceTranscript string,
	targetErrorRate float32,
	enableAutomaticPunctuation bool) {

	leopard = NewLeopard(testAccessKey)
	leopard.EnableAutomaticPunctuation = enableAutomaticPunctuation

	modelPath, _ := filepath.Abs(filepath.Join("../../lib/common", appendLanguage("leopard_params", language)+".pv"))
	leopard.ModelPath = modelPath

	err := leopard.Init()
	if err != nil {
		log.Fatalf("Failed to init leopard with: %v", err)
	}
	defer leopard.Delete()

	testAudioPath, _ := filepath.Abs(filepath.Join("../../resources/audio_samples", testAudioFile))
	data, err := ioutil.ReadFile(testAudioPath)
	if err != nil {
		t.Fatalf("Could not read test file: %v", err)
	}
	data = data[44:] // skip header

	totalFrames := len(data) / 2
	pcm := make([]int16, totalFrames)

	for i := 0; i < totalFrames; i++ {
		pcm[i] = int16(binary.LittleEndian.Uint16(data[2*i : (2*i)+2]))
	}

	transcript, words, err := leopard.Process(pcm)
	if err != nil {
		t.Fatalf("Failed to process pcm buffer: %v", err)
	}

	t.Logf("%s", transcript)
	t.Logf("%s", referenceTranscript)

	errorRate := float32(levenshtein.ComputeDistance(transcript, referenceTranscript)) / float32(len(referenceTranscript))
	if errorRate >= targetErrorRate {
		t.Fatalf("Expected '%f' got '%f'", targetErrorRate, errorRate)
	}

	validateMetadata(t, transcript, words, float32(len(pcm))/float32(SampleRate))
}

func runProcessFileTestCase(
	t *testing.T,
	language string,
	testAudioFile string,
	referenceTranscript string,
	targetErrorRate float32,
	enableAutomaticPunctuation bool) {

	leopard = NewLeopard(testAccessKey)
	leopard.EnableAutomaticPunctuation = enableAutomaticPunctuation

	modelPath, _ := filepath.Abs(filepath.Join("../../lib/common", appendLanguage("leopard_params", language)+".pv"))
	leopard.ModelPath = modelPath

	err := leopard.Init()
	if err != nil {
		log.Fatalf("Failed to init leopard with: %v", err)
	}
	defer leopard.Delete()

	testAudioPath, _ := filepath.Abs(filepath.Join("../../resources/audio_samples", testAudioFile))
	transcript, words, err := leopard.ProcessFile(testAudioPath)
	if err != nil {
		t.Fatalf("Failed to process pcm buffer: %v", err)
	}
	errorRate := float32(levenshtein.ComputeDistance(transcript, referenceTranscript)) / float32(len(referenceTranscript))
	if errorRate >= targetErrorRate {
		t.Fatalf("Expected '%f' got '%f'", targetErrorRate, errorRate)
	}

	data, err := ioutil.ReadFile(testAudioPath)
	if err != nil {
		t.Fatalf("Could not read test file: %v", err)
	}
	data = data[44:] // skip header

	validateMetadata(t, transcript, words, (float32(len(data))/float32(2))/float32(SampleRate))
}

func TestProcess(t *testing.T) {
	for _, test := range processTestParameters {
		t.Logf("Running process data test for `%s`", test.language)
		runProcessTestCase(t, test.language, test.testAudioFile, test.transcript, test.errorRate, test.enableAutomaticPunctuation)
	}
}

func TestProcessFile(t *testing.T) {
	for _, test := range processTestParameters {
		t.Logf("Running process file test for `%s`", test.language)
		runProcessTestCase(t, test.language, test.testAudioFile, test.transcript, test.errorRate, test.enableAutomaticPunctuation)
	}
}

func TestProcessEmptyFile(t *testing.T) {
	leopard = NewLeopard(testAccessKey)
	err := leopard.Init()
	if err != nil {
		log.Fatalf("Failed to init leopard with: %v", err)
	}
	defer leopard.Delete()

	testAudioPath, _ := filepath.Abs(filepath.Join("../../resources/audio_samples", "empty.wav"))
	transcript, words, err := leopard.ProcessFile(testAudioPath)
	if err != nil {
		t.Fatalf("Failed to process pcm buffer: %v", err)
	}
	if len(transcript) > 0 {
		t.Fatalf("Leopard returned transcript on empty file `%s`", transcript)
	}

	if len(words) > 0 {
		t.Fatalf("Leopard returned %d words on empty file", len(words))
	}
}
