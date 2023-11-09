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

package leopard

import (
	"encoding/binary"
	"encoding/json"
	"flag"
	"io/ioutil"
	"log"
	"math"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"

	"github.com/agnivade/levenshtein"
)

type LanguageTestParameters struct {
	language                  string
	testAudioFile             string
	transcript                string
	transcriptWithPunctuation string
	errorRate                 float32
	words                     []LeopardWord
}

type DiarizationTestParameters struct {
	language      string
	testAudioFile string
	words         []LeopardWord
}

var (
	testAccessKey    string
	leopard          Leopard
	languageTests    []LanguageTestParameters
	diarizationTests []DiarizationTestParameters
)

func TestMain(m *testing.M) {

	flag.StringVar(&testAccessKey, "access_key", "", "AccessKey for testing")
	flag.Parse()

	languageTests, diarizationTests = loadTestData()
	os.Exit(m.Run())
}

func isClose(value, expected, tolerance float32) bool {
	return math.Abs(float64(value-expected)) <= float64(tolerance)
}

func appendLanguage(s string, language string) string {
	if language == "en" {
		return s
	} else {
		return s + "_" + language
	}
}

func loadTestData() (languageTests []LanguageTestParameters, diarizationTests []DiarizationTestParameters) {

	content, err := ioutil.ReadFile("../../resources/.test/test_data.json")
	if err != nil {
		log.Fatalf("Could not read test data json: %v", err)
	}

	var testData struct {
		Tests struct {
			LanguageTests []struct {
				Language                  string  `json:"language"`
				AudioFile                 string  `json:"audio_file"`
				Transcript                string  `json:"transcript"`
				TranscriptWithPunctuation string  `json:"transcript_with_punctuation"`
				ErrorRate                 float32 `json:"error_rate"`
				Words                     []struct {
					Word       string  `json:"word"`
					StartSec   float32 `json:"start_sec"`
					EndSec     float32 `json:"end_sec"`
					Confidence float32 `json:"confidence"`
					SpeakerTag int32   `json:"speaker_tag"`
				} `json:"words"`
			} `json:"language_tests"`
			DiarizationTests []struct {
				Language  string `json:"language"`
				AudioFile string `json:"audio_file"`
				Words     []struct {
					Word       string `json:"word"`
					SpeakerTag int32  `json:"speaker_tag"`
				} `json:"words"`
			} `json:"diarization_tests"`
		} `json:"tests"`
	}
	err = json.Unmarshal(content, &testData)
	if err != nil {
		log.Fatalf("Could not decode test data json: %v", err)
	}

	for _, x := range testData.Tests.LanguageTests {
		languageTestParameters := LanguageTestParameters{
			language:                  x.Language,
			testAudioFile:             x.AudioFile,
			transcript:                x.Transcript,
			transcriptWithPunctuation: x.TranscriptWithPunctuation,
			errorRate:                 x.ErrorRate,
		}

		for _, y := range x.Words {
			word := LeopardWord{
				Word:       y.Word,
				StartSec:   y.StartSec,
				EndSec:     y.EndSec,
				Confidence: y.Confidence,
				SpeakerTag: y.SpeakerTag,
			}
			languageTestParameters.words = append(languageTestParameters.words, word)
		}

		languageTests = append(languageTests, languageTestParameters)
	}

	for _, x := range testData.Tests.DiarizationTests {
		diarizationTestParameters := DiarizationTestParameters{
			language:      x.Language,
			testAudioFile: x.AudioFile,
		}

		for _, y := range x.Words {
			word := LeopardWord{
				Word:       y.Word,
				SpeakerTag: y.SpeakerTag,
			}
			diarizationTestParameters.words = append(diarizationTestParameters.words, word)
		}

		diarizationTests = append(diarizationTests, diarizationTestParameters)
	}

	return languageTests, diarizationTests
}

func validateMetadata(t *testing.T, referenceWords []LeopardWord, words []LeopardWord, enableDiarization bool) {
	for i := range words {
		word := strings.ToUpper(words[i].Word)
		referenceWord := strings.ToUpper(referenceWords[i].Word)
		if word != referenceWord {
			t.Fatalf("Word `%s` did not match expected word `%s`", word, referenceWord)
		}
		if !isClose(words[i].StartSec, referenceWords[i].StartSec, 0.1) {
			t.Fatalf("Word %d started at %f, expected %f", i, words[i].StartSec, referenceWords[i].StartSec)
		}
		if !isClose(words[i].EndSec, referenceWords[i].EndSec, 0.1) {
			t.Fatalf("Word %d ended at %f, expected %f", i, words[i].EndSec, referenceWords[i].EndSec)
		}
		if !isClose(words[i].Confidence, referenceWords[i].Confidence, 0.1) {
			t.Fatalf("Word %d had a confidence of %f, expected %f", i, words[i].Confidence, referenceWords[i].Confidence)
		}
		if enableDiarization {
			if words[i].SpeakerTag != referenceWords[i].SpeakerTag {
				t.Fatalf("Word %d had speaker_tag of %d, expected %d", i, words[i].SpeakerTag, referenceWords[i].SpeakerTag)
			}
		} else {
			if words[i].SpeakerTag != -1 {
				t.Fatalf("Word %d had speaker_tag of %d, expected -1", i, words[i].SpeakerTag)
			}
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
	enableAutomaticPunctuation bool,
	enableDiarization bool,
	referenceWords []LeopardWord) {

	leopard = NewLeopard(testAccessKey)
	leopard.EnableAutomaticPunctuation = enableAutomaticPunctuation
	leopard.EnableDiarization = enableDiarization

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

	errorRate := float32(levenshtein.ComputeDistance(transcript, referenceTranscript)) / float32(len(referenceTranscript))
	if errorRate >= targetErrorRate {
		t.Fatalf("Expected '%f' got '%f'", targetErrorRate, errorRate)
	}

	validateMetadata(t, referenceWords, words, enableDiarization)
}

func runProcessFileTestCase(
	t *testing.T,
	language string,
	testAudioFile string,
	referenceTranscript string,
	targetErrorRate float32,
	enableAutomaticPunctuation bool,
	enableDiarization bool,
	referenceWords []LeopardWord) {

	leopard = NewLeopard(testAccessKey)
	leopard.EnableAutomaticPunctuation = enableAutomaticPunctuation
	leopard.EnableDiarization = enableDiarization

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

	validateMetadata(t, referenceWords, words, enableDiarization)
}

func runDiarizationTestCase(
	t *testing.T,
	language string,
	testAudioFile string,
	referenceWords []LeopardWord) {

	leopard = NewLeopard(testAccessKey)
	leopard.EnableDiarization = true

	modelPath, _ := filepath.Abs(filepath.Join("../../lib/common", appendLanguage("leopard_params", language)+".pv"))
	leopard.ModelPath = modelPath

	err := leopard.Init()
	if err != nil {
		log.Fatalf("Failed to init leopard with: %v", err)
	}
	defer leopard.Delete()

	testAudioPath, _ := filepath.Abs(filepath.Join("../../resources/audio_samples", testAudioFile))
	_, words, err := leopard.ProcessFile(testAudioPath)
	if err != nil {
		t.Fatalf("Failed to process pcm buffer: %v", err)
	}

	for i := range words {
		word := strings.ToUpper(words[i].Word)
		referenceWord := strings.ToUpper(referenceWords[i].Word)
		if word != referenceWord {
			t.Fatalf("Word `%s` did not match expected word `%s`", word, referenceWord)
		}
		if words[i].SpeakerTag != referenceWords[i].SpeakerTag {
			t.Fatalf("Word %d had speaker_tag of %d, expected %d", i, words[i].SpeakerTag, referenceWords[i].SpeakerTag)
		}
	}
}

func TestProcess(t *testing.T) {
	for _, test := range languageTests {
		t.Logf("Running process data test for `%s`", test.language)
		runProcessTestCase(
			t,
			test.language,
			test.testAudioFile,
			test.transcript,
			test.errorRate,
			false,
			false,
			test.words)
	}
}

func TestProcessFile(t *testing.T) {
	for _, test := range languageTests {
		t.Logf("Running process file test for `%s`", test.language)
		runProcessFileTestCase(
			t,
			test.language,
			test.testAudioFile,
			test.transcript,
			test.errorRate,
			false,
			false,
			test.words)
	}
}

func TestProcessFileWithPunctuation(t *testing.T) {
	for _, test := range languageTests {
		t.Logf("Running process file with punctuation test for `%s`", test.language)
		runProcessFileTestCase(
			t,
			test.language,
			test.testAudioFile,
			test.transcriptWithPunctuation,
			test.errorRate,
			true,
			false,
			test.words)
	}
}

func TestProcessFileWithDiarization(t *testing.T) {
	for _, test := range languageTests {
		t.Logf("Running process file with diarization test for `%s`", test.language)
		runProcessFileTestCase(
			t,
			test.language,
			test.testAudioFile,
			test.transcript,
			test.errorRate,
			false,
			true,
			test.words)
	}
}

func TestDiarization(t *testing.T) {
	for _, test := range diarizationTests {
		t.Logf("Running diarization test for `%s`", test.language)
		runDiarizationTestCase(
			t,
			test.language,
			test.testAudioFile,
			test.words)
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
