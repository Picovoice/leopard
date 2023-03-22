#
#    Copyright 2018-2023 Picovoice Inc.
#
#    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
#    file accompanying this source.
#
#    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
#    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
#    specific language governing permissions and limitations under the License.
#

import sys
import unittest

from parameterized import parameterized

from _leopard import *
from _util import *
from test_util import *


parameters = load_test_data()


class LeopardTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._access_key = sys.argv[1]
        cls._audio_directory = os.path.join('..', '..', 'resources', 'audio_samples')

    def _validate_metadata(self, words: Sequence[Leopard.Word], transcript: str, audio_length: int):
        norm_transcript = transcript.upper()
        for i in range(len(words)):
            self.assertTrue(words[i].word.upper() in norm_transcript)
            self.assertGreater(words[i].start_sec, 0)
            self.assertLessEqual(words[i].start_sec, words[i].end_sec)
            if i < len(words) - 1:
                self.assertLessEqual(words[i].end_sec, words[i + 1].start_sec)
            else:
                self.assertLessEqual(words[i].end_sec, audio_length)
            self.assertTrue(0 <= words[i].confidence <= 1)

    def test_invalid_access_key(self):
        with self.assertRaises(LeopardInvalidArgumentError):
            Leopard(
                access_key='invalid',
                model_path=default_model_path('../../'),
                library_path=default_library_path('../../'))

    def test_invalid_model_path(self):
        with self.assertRaises(LeopardIOError):
            Leopard(
                access_key=self._access_key,
                model_path='invalid',
                library_path=default_library_path('../../'))

    def test_invalid_library_path(self):
        with self.assertRaises(LeopardIOError):
            Leopard(
                access_key=self._access_key,
                model_path=default_model_path('../../'),
                library_path='invalid')

    def test_version(self):
        o = Leopard(
                access_key=self._access_key,
                model_path=default_model_path('../../'),
                library_path=default_library_path('../../'))
        self.assertIsInstance(o.version, str)
        self.assertGreater(len(o.version), 0)

    @parameterized.expand(parameters)
    def test_process(
            self,
            language: str,
            audio_file: str,
            expected_transcript: str,
            punctuations: List[str],
            error_rate: float):
        o = None

        try:
            o = Leopard(
                    access_key=self._access_key,
                    model_path=get_model_path_by_language(relative='../../', language=language),
                    library_path=default_library_path('../../'))

            pcm = read_wav_file(
                file_name=os.path.join(self._audio_directory, audio_file),
                sample_rate=o.sample_rate)

            transcript, words = o.process(pcm)
            normalized_transcript = expected_transcript
            for punctuation in punctuations:
                normalized_transcript = normalized_transcript.replace(punctuation, "")

            use_cer = language == 'ja'

            self.assertLessEqual(
                get_word_error_rate(transcript, normalized_transcript, use_cer),
                error_rate)
            self._validate_metadata(words, transcript, len(pcm))

        finally:
            if o is not None:
                o.delete()

    @parameterized.expand(parameters)
    def test_process_file(
            self,
            language: str,
            audio_file: str,
            expected_transcript: str,
            punctuations: List[str],
            error_rate: float):
        o = None

        try:
            o = Leopard(
                    access_key=self._access_key,
                    model_path=get_model_path_by_language(relative='../../', language=language),
                    library_path=default_library_path('../../'))

            transcript, words = o.process_file(os.path.join(self._audio_directory, audio_file))
            normalized_transcript = expected_transcript
            for punctuation in punctuations:
                normalized_transcript = normalized_transcript.replace(punctuation, "")

            pcm = read_wav_file(
                file_name=os.path.join(self._audio_directory, audio_file),
                sample_rate=o.sample_rate)

            use_cer = language == 'ja'

            self.assertLessEqual(
                get_word_error_rate(transcript, normalized_transcript, use_cer),
                error_rate)
            self._validate_metadata(words, transcript, len(pcm))

        finally:
            if o is not None:
                o.delete()

    @parameterized.expand(parameters)
    def test_process_file_with_punctuation(
            self,
            language: str,
            audio_file: str,
            expected_transcript: str,
            _: List[str],
            error_rate: float):
        o = None

        try:
            o = Leopard(
                    access_key=self._access_key,
                    model_path=get_model_path_by_language(relative='../../', language=language),
                    library_path=default_library_path('../../'),
                    enable_automatic_punctuation=True)

            transcript, words = o.process_file(os.path.join(self._audio_directory, audio_file))

            pcm = read_wav_file(
                file_name=os.path.join(self._audio_directory, audio_file),
                sample_rate=o.sample_rate)

            use_cer = language == 'ja'

            self.assertLessEqual(
                get_word_error_rate(transcript, expected_transcript, use_cer),
                error_rate)
            self._validate_metadata(words, transcript, len(pcm))

        finally:
            if o is not None:
                o.delete()


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("usage: %s ${ACCESS_KEY}" % sys.argv[0])
        exit(1)

    unittest.main(argv=sys.argv[:1])
