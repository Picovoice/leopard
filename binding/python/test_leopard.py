#
#    Copyright 2018-2022 Picovoice Inc.
#
#    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
#    file accompanying this source.
#
#    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
#    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
#    specific language governing permissions and limitations under the License.
#

import os
import sys
import unittest
import wave

import numpy as np

import util
from leopard import Leopard


class LeopardTestCase(unittest.TestCase):
    AUDIO_PATH = os.path.join(os.path.dirname(__file__), '../../resources/audio_samples/test.wav')
    TRANSCRIPT = "MR QUILTER IS THE APOSTLE OF THE MIDDLE CLASSES AND WE ARE GLAD TO WELCOME HIS GOSPEL"

    @classmethod
    def setUpClass(cls):
        cls._o = Leopard(access_key=sys.argv[1], library_path=util.pv_library_path('../..'),
                         model_path=util.pv_model_path('../..'))

    def test_process(self):
        with wave.open(self.AUDIO_PATH, 'rb') as f:
            pcm = np.frombuffer(f.readframes(f.getnframes()), np.int16)

        self.assertEqual(self._o.process(pcm), self.TRANSCRIPT)

    def test_process_file(self):
        self.assertEqual(self._o.process_file(self.AUDIO_PATH), self.TRANSCRIPT)


if __name__ == '__main__':
    unittest.main(argv=sys.argv[:1])
