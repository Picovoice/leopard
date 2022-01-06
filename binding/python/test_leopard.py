#
#    Copyright 2018 Picovoice Inc.
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

from leopard import Leopard


class LeopardTestCase(unittest.TestCase):
    def test_process(self):
        def abs_path(rel_path):
            return os.path.join(os.path.dirname(__file__), '../..', rel_path)

        leopard = Leopard(
            access_key=sys.argv[1],
            library_path=abs_path('lib/linux/x86_64/libpv_leopard.so'),
            model_path=abs_path('lib/common/leopard_params.pv'))

        with wave.open(abs_path('resources/audio_samples/test.wav'), 'rb') as f:
            assert f.getframerate() == leopard.sample_rate
            assert f.getnchannels() == 1
            assert f.getsampwidth() == 2
            pcm = np.frombuffer(f.readframes(f.getnframes()), np.int16)

        transcript = leopard.process(pcm)
        self.assertEqual(
            transcript,
            "MR QUILTER IS THE APOSTLE OF THE MIDDLE CLASSES AND WE ARE GLAD TO WELCOME HIS GOSPEL")


if __name__ == '__main__':
    unittest.main(argv=sys.argv[:1])
