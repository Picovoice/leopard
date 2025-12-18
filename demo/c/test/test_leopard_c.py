#
# Copyright 2023-2025 Picovoice Inc.
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

language_tests = load_languages_test_data()


class LeopardCTestCase(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls._access_key = sys.argv[1]
        cls._device = sys.argv[2]
        cls._platform = sys.argv[3]
        cls._arch = "" if len(sys.argv) != 5 else sys.argv[4]
        cls._root_dir = os.path.join(os.path.dirname(__file__), "../../..")

    def _get_library_file(self):
        if self._platform == "windows":
            if self._arch == "amd64":
                os.environ["PATH"] += os.pathsep + os.path.join(self._root_dir, "lib", "windows", "amd64")

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

    @parameterized.expand(language_tests)
    def test_leopard(
            self,
            language,
            audio_file_name,
            ground_truth,
            error_rate):
        args = [
            os.path.join(os.path.dirname(__file__), "../build/leopard_demo"),
            "-a", self._access_key,
            "-y", self._device,
            "-l", self._get_library_file(),
            "-m", self._get_model_path_by_language(language),
            os.path.join(self._root_dir, 'resources/audio_samples', audio_file_name),
        ]
        process = subprocess.Popen(args, stderr=subprocess.PIPE, stdout=subprocess.PIPE)
        stdout, stderr = process.communicate()
        self.assertEqual(process.poll(), 0)
        self.assertEqual(stderr.decode('utf-8'), '')
        transcript = stdout.decode('utf-8').strip().split('\n')[1]
        error = wer(ground_truth, transcript)
        self.assertLessEqual(error, error_rate)

    def test_list_hardware_devices(self):
        args = [
            os.path.join(os.path.dirname(__file__), "../build/leopard_demo"),
            "-l", self._get_library_file(),
            "-z"
        ]
        process = subprocess.Popen(args, stderr=subprocess.PIPE, stdout=subprocess.PIPE)
        stdout, stderr = process.communicate()
        self.assertEqual(process.poll(), 0)
        self.assertEqual(stderr.decode('utf-8'), '')


if __name__ == '__main__':
    if len(sys.argv) < 4 or len(sys.argv) > 5:
        print("usage: test_leopard_c.py ${AccessKey} ${Device} ${Platform} [${Arch}]")
        exit(1)
    unittest.main(argv=sys.argv[:1])
