/*
  Copyright 2022-2023 Picovoice Inc.
  You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
  file accompanying this source.
  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
  specific language governing permissions and limitations under the License.
*/

export type LeopardWord = {
  /** Transcribed word. */
  word: string;
  /** Start of word in seconds. */
  startSec: number;
  /** End of word in seconds. */
  endSec: number;
  /** Transcription confidence. It is a number within [0, 1]. */
  confidence: number;
  /** Speaker tag. It is set to `-1` if speaker diarization is not enabled during initialization. */
  speakerTag: number;
};

export type LeopardTranscript = {
  /** Inferred transcription. */
  transcript: string;
  /** Transcribed words and their associated metadata. */
  words: LeopardWord[];
};

export type LeopardOptions = {
  /** Set to `true` to enable automatic punctuation insertion. */
  enableAutomaticPunctuation?: boolean;
  /** Set to `true` to enable speaker diarization. */
  enableDiarization?: boolean;
};
