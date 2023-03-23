#
# Copyright 2023 Picovoice Inc.
#
# You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
# file accompanying this source.
#
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
# an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
# specific language governing permissions and limitations under the License.
#

import os.path
import subprocess
import sys
import unittest

from jiwer import wer
from parameterized import parameterized

from test_util import *

test_parameters = load_test_data()


class PorcupineCTestCase(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls._access_key = sys.argv[1]
        cls._platform = sys.argv[2]
        cls._arch = "" if len(sys.argv) != 4 else sys.argv[3]
        cls._root_dir = os.path.join(os.path.dirname(__file__), "../../..")

    def _get_library_file(self):
        return os.path.join(
            self._root_dir,
            "lib",
            self._platform,
            self._arch,
            "libpv_leopard." + get_lib_ext(self._platform)
        )

    def _get_model_path_by_language(self, language):
        model_path_subdir = append_language('lib/common/leopard_params', language)
        return os.path.join(self._root_dir, '%s.pv' % model_path_subdir)

    @parameterized.expand(test_parameters)
    def test_leopard(self, language, audio_file_name, ground_truth, error_rate):
        args = [
            os.path.join(os.path.dirname(__file__), "../build/leopard_demo"),
            "-a", self._access_key,
            "-l", self._get_library_file(),
            "-m", self._get_model_path_by_language(language),
            os.path.join(self._root_dir, 'resources/audio_samples', audio_file_name),
        ]
        print(args)
        process = subprocess.Popen(args, stderr=subprocess.PIPE, stdout=subprocess.PIPE)
        stdout, stderr = process.communicate()
        self.assertEqual(process.poll(), 0)
        self.assertEqual(stderr.decode('utf-8'), '')
        transcript = stdout.decode('utf-8').strip().split('\n')[1]
        error = wer(ground_truth, transcript)
        self.assertLessEqual(error, error_rate)


if __name__ == '__main__':
    if len(sys.argv) < 3 or len(sys.argv) > 4:
        print("usage: test_leopard_c.py ${AccessKey} ${Platform} [${Arch}]")
        exit(1)
    unittest.main(argv=sys.argv[:1])
