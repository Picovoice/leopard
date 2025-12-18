#
#    Copyright 2022-2025 Picovoice Inc.
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
import time
import unittest

from _leopard import Leopard
from _util import *


class LeopardPerformanceTestCase(unittest.TestCase):
    ACCESS_KEY = sys.argv[1]
    DEVICE = sys.argv[2]
    NUM_TEST_ITERATIONS = int(sys.argv[3])
    INIT_PERFORMANCE_THRESHOLD_SEC = float(sys.argv[4])
    PROC_PERFORMANCE_THRESHOLD_SEC = float(sys.argv[5])
    AUDIO_PATH = os.path.join(os.path.dirname(__file__), '../../resources/audio_samples/test.wav')

    def test_performance_init(self):

        perf_results = list()
        for i in range(self.NUM_TEST_ITERATIONS):
            start = time.perf_counter()
            leopard = Leopard(
                access_key=self.ACCESS_KEY,
                device=self.DEVICE,
                library_path=default_library_path('../..'),
                model_path=default_model_path('../..')
            )
            init_time = time.perf_counter() - start

            if i > 0:
                perf_results.append(init_time)

            leopard.delete()

        avg_perf = sum(perf_results) / self.NUM_TEST_ITERATIONS
        print("Average init performance: %s" % avg_perf)
        self.assertLess(avg_perf, self.INIT_PERFORMANCE_THRESHOLD_SEC)

    def test_performance_proc(self):
        leopard = Leopard(
            access_key=self.ACCESS_KEY,
            device=self.DEVICE,
            library_path=default_library_path('../..'),
            model_path=default_model_path('../..')
        )

        perf_results = list()
        for i in range(self.NUM_TEST_ITERATIONS):
            start = time.perf_counter()
            leopard.process_file(self.AUDIO_PATH)
            proc_time = time.perf_counter() - start

            if i > 0:
                perf_results.append(proc_time)

        leopard.delete()

        avg_perf = sum(perf_results) / self.NUM_TEST_ITERATIONS
        print("Average proc performance: %s" % avg_perf)
        self.assertLess(avg_perf, self.PROC_PERFORMANCE_THRESHOLD_SEC)


if __name__ == '__main__':
    if len(sys.argv) != 6:
        print("usage: test_leopard_perf.py ${ACCESS_KEY} ${DEVICE} ${NUM_TEST_INTERVALS} "
              "${INIT_PERFORMANCE_THRESHOLD_SEC} ${PROC_PERFORMANCE_THRESHOLD_SEC}")
        exit(1)

    unittest.main(argv=sys.argv[:1])
