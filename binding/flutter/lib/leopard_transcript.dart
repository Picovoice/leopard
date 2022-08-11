//
// Copyright 2022 Picovoice Inc.
//
// You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
// file accompanying this source.
//
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
// an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.
//

class LeopardTranscript {
  final String? _transcript;
  final List<LeopardWord>? _words;

  LeopardTranscript(this._transcript, this._words);

  String get transcript => _transcript ?? "";

  List<LeopardWord> get words => _words ?? [];
}

class LeopardWord {
  final String? _word;

  final double startSec;
  final double endSec;
  final double confidence;

  LeopardWord(this._word, this.startSec, this.endSec, this.confidence);

  String get word => _word ?? "";
}
