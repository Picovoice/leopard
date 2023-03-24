//
// Copyright 2022-2023 Picovoice Inc.
//
// You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
// file accompanying this source.
//
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
// an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.
//
'use strict';

import { Leopard } from '../src';
import * as path from 'path';
import { performance } from 'perf_hooks';

const WAV_PATH = '../../../resources/audio_samples/test.wav';

const ACCESS_KEY =
  process.argv
    .filter(x => x.startsWith('--access_key='))[0]
    ?.split('--access_key=')[1] ?? '';
const NUM_TEST_ITERATIONS = Number(
  process.argv
    .filter(x => x.startsWith('--num_test_iterations='))[0]
    ?.split('--num_test_iterations=')[1] ?? 0
);
const INIT_PERFORMANCE_THRESHOLD_SEC = Number(
  process.argv
    .filter(x => x.startsWith('--init_performance_threshold_sec='))[0]
    ?.split('--init_performance_threshold_sec=')[1] ?? 0
);
const PROC_PERFORMANCE_THRESHOLD_SEC = Number(
  process.argv
    .filter(x => x.startsWith('--proc_performance_threshold_sec='))[0]
    ?.split('--proc_performance_threshold_sec=')[1] ?? 0
);

describe('Performance', () => {
  test('init performance', () => {
    let perfResults = [];
    for (let i = 0; i < NUM_TEST_ITERATIONS; i++) {
      const before = performance.now();
      let leopardEngine = new Leopard(ACCESS_KEY);
      let initTime = performance.now() - before;

      leopardEngine.release();

      if (i > 0) {
        perfResults.push(initTime);
      }
    }

    let avgPerfMs =
      perfResults.reduce((acc, a) => acc + a, 0) / NUM_TEST_ITERATIONS;
    let avgPerfSec = Number((avgPerfMs / 1000).toFixed(3));
    // eslint-disable-next-line no-console
    console.log('Average init performance: ' + avgPerfSec);
    expect(avgPerfSec).toBeLessThanOrEqual(INIT_PERFORMANCE_THRESHOLD_SEC);
  });

  test('proc performance', () => {
    const waveFilePath = path.join(__dirname, WAV_PATH);
    let leopardEngine = new Leopard(ACCESS_KEY);

    let perfResults = [];
    for (let i = 0; i < NUM_TEST_ITERATIONS; i++) {
      const before = performance.now();
      leopardEngine.processFile(waveFilePath);
      let procTime = performance.now() - before;

      if (i > 0) {
        perfResults.push(procTime);
      }
    }
    leopardEngine.release();

    let avgPerfMs =
      perfResults.reduce((acc, a) => acc + a, 0) / NUM_TEST_ITERATIONS;
    let avgPerfSec = Number((avgPerfMs / 1000).toFixed(3));
    // eslint-disable-next-line no-console
    console.log('Average proc performance: ' + avgPerfSec);
    expect(avgPerfSec).toBeLessThanOrEqual(PROC_PERFORMANCE_THRESHOLD_SEC);
  });
});
