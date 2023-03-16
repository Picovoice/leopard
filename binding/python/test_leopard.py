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

import os
import struct
import sys
import unittest
import wave
from typing import *

from parameterized import parameterized

from _leopard import Leopard
from _util import *

WORDS = [
    Leopard.Word(word="Mr", start_sec=0.58, end_sec=0.80, confidence=0.95),
    Leopard.Word(word="quilter", start_sec=0.86, end_sec=1.18, confidence=0.80),
    Leopard.Word(word="is", start_sec=1.31, end_sec=1.38, confidence=0.96),
    Leopard.Word(word="the", start_sec=1.44, end_sec=1.50, confidence=0.90),
    Leopard.Word(word="apostle", start_sec=1.57, end_sec=2.08, confidence=0.79),
    Leopard.Word(word="of", start_sec=2.18, end_sec=2.24, confidence=0.98),
    Leopard.Word(word="the", start_sec=2.30, end_sec=2.34, confidence=0.98),
    Leopard.Word(word="middle", start_sec=2.40, end_sec=2.59, confidence=0.97),
    Leopard.Word(word="classes", start_sec=2.69, end_sec=3.17, confidence=0.98),
    Leopard.Word(word="and", start_sec=3.36, end_sec=3.46, confidence=0.95),
    Leopard.Word(word="we", start_sec=3.52, end_sec=3.55, confidence=0.96),
    Leopard.Word(word="are", start_sec=3.65, end_sec=3.65, confidence=0.97),
    Leopard.Word(word="glad", start_sec=3.74, end_sec=4.03, confidence=0.93),
    Leopard.Word(word="to", start_sec=4.10, end_sec=4.16, confidence=0.97),
    Leopard.Word(word="welcome", start_sec=4.22, end_sec=4.58, confidence=0.89),
    Leopard.Word(word="his", start_sec=4.67, end_sec=4.83, confidence=0.96),
    Leopard.Word(word="gospel", start_sec=4.93, end_sec=5.38, confidence=0.93),
]

TEST_PARAMS = [
    [False, "Mr quilter is the apostle of the middle classes and we are glad to welcome his gospel"],
    [True, "Mr. Quilter is the apostle of the middle classes and we are glad to welcome his gospel."],
]


class LeopardTestCase(unittest.TestCase):
    audio_path = None

    @classmethod
    def setUpClass(cls):
        cls.audio_path = os.path.join(os.path.dirname(__file__), '../../resources/audio_samples/test.wav')
        with wave.open(cls.audio_path, 'rb') as f:
            buffer = f.readframes(f.getnframes())
            cls.pcm = struct.unpack('%dh' % (len(buffer) / struct.calcsize('h')), buffer)

    @staticmethod
    def _create_leopard(enable_automatic_punctuation: bool) -> Leopard:
        return Leopard(
            access_key=sys.argv[1],
            model_path=default_model_path('../..'),
            library_path=default_library_path('../..'),
            enable_automatic_punctuation=enable_automatic_punctuation
        )

    def _check_result(self, transcript: str, ref_transcript: str, words: Sequence[Leopard.Word]):
        self.assertEqual(transcript, ref_transcript)
        self.assertEqual(len(words), len(WORDS))
        for word, ref_word in zip(words, WORDS):
            self.assertEqual(word.word, ref_word.word)
            self.assertAlmostEqual(word.start_sec, ref_word.start_sec, delta=0.01)
            self.assertAlmostEqual(word.end_sec, ref_word.end_sec, delta=0.01)
            self.assertAlmostEqual(word.confidence, ref_word.confidence, delta=0.1)

    @parameterized.expand(TEST_PARAMS)
    def test_process(self, enable_automatic_punctuation: bool, ref_transcript: str):
        o = None

        try:
            o = self._create_leopard(enable_automatic_punctuation=enable_automatic_punctuation)
            transcript, words = o.process(self.pcm)
            self._check_result(transcript=transcript, ref_transcript=ref_transcript, words=words)
        finally:
            if o is not None:
                o.delete()

    @parameterized.expand(TEST_PARAMS)
    def test_process_file(self, enable_automatic_punctuation: bool, ref_transcript: str):
        o = None

        try:
            o = self._create_leopard(enable_automatic_punctuation=enable_automatic_punctuation)
            transcript, words = o.process_file(self.audio_path)
            self._check_result(transcript=transcript, ref_transcript=ref_transcript, words=words)
        finally:
            if o is not None:
                o.delete()

    def test_version(self):
        o = self._create_leopard(False)
        self.assertIsInstance(o.version, str)
        self.assertGreater(len(o.version), 0)


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("usage: %s ${ACCESS_KEY}" % sys.argv[0])
        exit(1)

    unittest.main(argv=sys.argv[:1])
