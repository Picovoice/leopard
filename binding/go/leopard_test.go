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
	"encoding/binary"
	"flag"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"reflect"
	"runtime"
	"testing"
)

var (
	testAccessKey string
	leopard       pvLeopard
	testAudioPath string
)

var processTestParameters = []struct {
	enableAutomaticPunctuation bool
	transcript                 string
}{
	{false, "Mr quilter is the apostle of the middle classes and we are glad to welcome his gospel"},
	{true, "Mr. Quilter is the apostle of the middle classes and we are glad to welcome his gospel."},
}

var referenceTranscriptMetadata = []LeopardWord{
	{Word: "Mr", StartSec: 0.58, EndSec: 0.80, Confidence: 0.95},
	{Word: "quilter", StartSec: 0.86, EndSec: 1.18, Confidence: 0.80},
	{Word: "is", StartSec: 1.31, EndSec: 1.38, Confidence: 0.96},
	{Word: "the", StartSec: 1.44, EndSec: 1.50, Confidence: 0.90},
	{Word: "apostle", StartSec: 1.57, EndSec: 2.08, Confidence: 0.79},
	{Word: "of", StartSec: 2.18, EndSec: 2.24, Confidence: 0.98},
	{Word: "the", StartSec: 2.30, EndSec: 2.34, Confidence: 0.98},
	{Word: "middle", StartSec: 2.40, EndSec: 2.59, Confidence: 0.97},
	{Word: "classes", StartSec: 2.69, EndSec: 3.17, Confidence: 0.98},
	{Word: "and", StartSec: 3.36, EndSec: 3.46, Confidence: 0.95},
	{Word: "we", StartSec: 3.52, EndSec: 3.55, Confidence: 0.96},
	{Word: "are", StartSec: 3.65, EndSec: 3.65, Confidence: 0.97},
	{Word: "glad", StartSec: 3.74, EndSec: 4.03, Confidence: 0.93},
	{Word: "to", StartSec: 4.10, EndSec: 4.16, Confidence: 0.97},
	{Word: "welcome", StartSec: 4.22, EndSec: 4.58, Confidence: 0.89},
	{Word: "his", StartSec: 4.67, EndSec: 4.83, Confidence: 0.96},
	{Word: "gospel", StartSec: 4.93, EndSec: 5.38, Confidence: 0.93},
}

func TestMain(m *testing.M) {

	flag.StringVar(&testAccessKey, "access_key", "", "AccessKey for testing")
	flag.Parse()

	_, filename, _, _ := runtime.Caller(0)
	dir := filepath.Dir(filename)

	testAudioPath, _ = filepath.Abs(filepath.Join(dir, "../../resources/audio_samples/test.wav"))

	os.Exit(m.Run())
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
	enableAutomaticPunctuation bool,
	expectedTranscript string) {

	leopard = NewLeopard(testAccessKey)
	leopard.EnableAutomaticPunctuation = enableAutomaticPunctuation
	err := leopard.Init()
	if err != nil {
		log.Fatalf("Failed to init leopard with: %v", err)
	}
	defer leopard.Delete()

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

	res, err := leopard.Process(pcm)
	if err != nil {
		t.Fatalf("Failed to process pcm buffer: %v", err)
	}
	if res.Transcript != expectedTranscript {
		t.Fatalf("Expected '%s' got '%s'", expectedTranscript, res.Transcript)
	}
}

func runProcessFileTestCase(
	t *testing.T,
	enableAutomaticPunctuation bool,
	expectedTranscript string) {

	leopard = NewLeopard(testAccessKey)
	leopard.EnableAutomaticPunctuation = enableAutomaticPunctuation
	err := leopard.Init()
	if err != nil {
		log.Fatalf("Failed to init leopard with: %v", err)
	}
	defer leopard.Delete()

	res, err := leopard.ProcessFile(testAudioPath)
	if err != nil {
		t.Fatalf("Failed to process pcm buffer: %v", err)
	}
	if res.Transcript != expectedTranscript {
		t.Fatalf("Expected '%s' got '%s'", expectedTranscript, res.Transcript)
	}
	reflect.DeepEqual(res.Words, referenceTranscriptMetadata)
}

func TestProcess(t *testing.T) {
	for _, test := range processTestParameters {
		runProcessTestCase(t, test.enableAutomaticPunctuation, test.transcript)
	}
}

func TestProcessFile(t *testing.T) {
	for _, test := range processTestParameters {
		runProcessFileTestCase(t, test.enableAutomaticPunctuation, test.transcript)
	}
}
