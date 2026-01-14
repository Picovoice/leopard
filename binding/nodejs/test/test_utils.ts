//
// Copyright 2023 Picovoice Inc.
//
// You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
// file accompanying this source.
//
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
// an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.
//
import * as path from 'path';
import { LeopardWord } from '../src';
import { getDirname } from '../src/platforms';

const ROOT_DIR = path.join(getDirname(), '../../..');
const TEST_DATA_JSON = require(path.join(
  ROOT_DIR,
  'resources/.test/test_data.json'
));

function appendLanguage(s: string, language: string): string {
  if (language === 'en') {
    return s;
  }
  return s + '_' + language;
}

export function getModelPathByLanguage(language: string): string {
  return path.join(
    ROOT_DIR,
    `${appendLanguage('lib/common/leopard_params', language)}.pv`
  );
}

export function getAudioFile(audioFile: string): string {
  return path.join(ROOT_DIR, 'resources/audio_samples', audioFile);
}

export function getLanguageTestParameters(): [
  string,
  string,
  string,
  number,
  string,
  LeopardWord[]
][] {
  let parametersJson = TEST_DATA_JSON.tests.language_tests;
  return parametersJson.map((x: any) => [
    x.language,
    x.transcript,
    x.transcript_with_punctuation,
    x.error_rate,
    x.audio_file,
    x.words.map((w: any) => ({
      word: w.word,
      startSec: w.start_sec,
      endSec: w.end_sec,
      confidence: w.confidence,
      speakerTag: w.speaker_tag,
    })),
  ]);
}

export function getDiarizationTestParameters(): [
  string,
  string,
  LeopardWord[]
][] {
  let parametersJson = TEST_DATA_JSON.tests.diarization_tests;
  return parametersJson.map((x: any) => [
    x.language,
    x.audio_file,
    x.words.map((w: any) => ({
      word: w.word,
      startSec: w.start_sec,
      endSec: w.end_sec,
      confidence: w.confidence,
      speakerTag: w.speaker_tag,
    })),
  ]);
}
