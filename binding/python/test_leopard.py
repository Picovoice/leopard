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

from _util import *
from test_util import *


language_tests, diarization_tests = load_test_data()


class LeopardTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._access_key = sys.argv[1]
        cls._audio_directory = os.path.join('..', '..', 'resources', 'audio_samples')

    def _validate_metadata(
            self,
            words: Sequence[Leopard.Word],
            expected_words: Sequence[Leopard.Word],
            enable_diarization: bool = False):
        for i in range(len(words)):
            self.assertEqual(words[i].word, expected_words[i].word)
            self.assertAlmostEqual(words[i].start_sec, expected_words[i].start_sec, delta=0.01)
            self.assertAlmostEqual(words[i].end_sec, expected_words[i].end_sec, delta=0.01)
            self.assertAlmostEqual(words[i].confidence, expected_words[i].confidence, delta=0.01)
            if enable_diarization:
                self.assertEqual(words[i].speaker_tag, expected_words[i].speaker_tag)
            else:
                self.assertEqual(words[i].speaker_tag, -1)

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

    @parameterized.expand(language_tests)
    def test_process(
            self,
            language: str,
            audio_file: str,
            expected_transcript: str,
            _: str,
            error_rate: float,
            expected_words: Sequence[Leopard.Word]):
        o = None

        try:
            o = Leopard(
                access_key=self._access_key,
                model_path=get_model_path_by_language(language=language),
                library_path=default_library_path('../../'))

            pcm = read_wav_file(
                file_name=os.path.join(self._audio_directory, audio_file),
                sample_rate=o.sample_rate)

            transcript, words = o.process(pcm)
            use_cer = language == 'ja'

            self.assertLessEqual(
                get_word_error_rate(transcript, expected_transcript, use_cer),
                error_rate)
            self._validate_metadata(words, expected_words)

        finally:
            if o is not None:
                o.delete()

    @parameterized.expand(language_tests)
    def test_process_file(
            self,
            language: str,
            audio_file: str,
            expected_transcript: str,
            _: str,
            error_rate: float,
            expected_words: Sequence[Leopard.Word]):
        o = None

        try:
            o = Leopard(
                access_key=self._access_key,
                model_path=get_model_path_by_language(language=language),
                library_path=default_library_path('../../'))

            transcript, words = o.process_file(os.path.join(self._audio_directory, audio_file))
            use_cer = language == 'ja'

            self.assertLessEqual(
                get_word_error_rate(transcript, expected_transcript, use_cer),
                error_rate)
            self._validate_metadata(words, expected_words)

        finally:
            if o is not None:
                o.delete()

    @parameterized.expand(language_tests)
    def test_process_file_with_punctuation(
            self,
            language: str,
            audio_file: str,
            _: str,
            expected_transcript_with_punctuation: str,
            error_rate: float,
            expected_words: Sequence[Leopard.Word]):
        o = None

        try:
            o = Leopard(
                access_key=self._access_key,
                model_path=get_model_path_by_language(language=language),
                library_path=default_library_path('../../'),
                enable_automatic_punctuation=True)

            transcript, words = o.process_file(os.path.join(self._audio_directory, audio_file))
            use_cer = language == 'ja'

            self.assertLessEqual(
                get_word_error_rate(transcript, expected_transcript_with_punctuation, use_cer),
                error_rate)
            self._validate_metadata(words, expected_words)

        finally:
            if o is not None:
                o.delete()

    @parameterized.expand(language_tests)
    def test_process_file_with_diarization(
            self,
            language: str,
            audio_file: str,
            expected_transcript: str,
            _: str,
            error_rate: float,
            expected_words: Sequence[Leopard.Word]):
        o = None

        try:
            o = Leopard(
                access_key=self._access_key,
                model_path=get_model_path_by_language(language=language),
                library_path=default_library_path('../../'),
                enable_diarization=True)

            transcript, words = o.process_file(os.path.join(self._audio_directory, audio_file))
            use_cer = language == 'ja'

            self.assertLessEqual(
                get_word_error_rate(transcript, expected_transcript, use_cer),
                error_rate)
            self._validate_metadata(words, expected_words, enable_diarization=True)

        finally:
            if o is not None:
                o.delete()

    @parameterized.expand(diarization_tests)
    def test_diarization_multiple_speakers(
            self,
            language: str,
            audio_file: str,
            expected_words: Sequence[Leopard.Word]):
        o = None
        try:
            o = Leopard(
                access_key=self._access_key,
                model_path=get_model_path_by_language(language=language),
                library_path=default_library_path('../../'),
                enable_diarization=True)

            _, words = o.process_file(os.path.join(self._audio_directory, audio_file))
            for i in range(len(words)):
                self.assertEqual(words[i].word, expected_words[i].word)
                self.assertEqual(words[i].speaker_tag, expected_words[i].speaker_tag)

        finally:
            if o is not None:
                o.delete()

    def test_message_stack(self):
        error = None
        try:
            o = Leopard(
                access_key='invalid',
                model_path=get_model_path_by_language(language='en'),
                library_path=default_library_path('../../'))
            self.assertIsNone(o)
        except LeopardError as e:
            error = e.message_stack

        self.assertIsNotNone(error)
        self.assertGreater(len(error), 0)

        try:
            o = Leopard(
                access_key='invalid',
                model_path=get_model_path_by_language(language='en'),
                library_path=default_library_path('../../'))
            self.assertIsNone(o)
        except LeopardError as e:
            self.assertEqual(len(error), len(e.message_stack))
            self.assertListEqual(list(error), list(e.message_stack))

    def test_index_search_message_stack(self):
        o = Leopard(
            access_key=self._access_key,
            model_path=get_model_path_by_language(language_tests[0][0]),
            library_path=default_library_path('../../'))

        res = o.process_file(os.path.join(self._audio_directory, language_tests[0][1]))
        self.assertIsNotNone(res)

        address = o._handle
        o._handle = None

        try:
            res = o.process_file(os.path.join(self._audio_directory, language_tests[0][1]))
            self.assertIsNone(res)
        except LeopardError as e:
            self.assertGreater(len(e.message_stack), 0)
            self.assertLess(len(e.message_stack), 8)
        finally:
            o._handle = address
            o.delete()


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("usage: %s ${ACCESS_KEY}" % sys.argv[0])
        exit(1)

    unittest.main(argv=sys.argv[:1])
