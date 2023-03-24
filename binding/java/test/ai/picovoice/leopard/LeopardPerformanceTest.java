/*
    Copyright 2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is
    located in the "LICENSE" file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the
    License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
    express or implied. See the License for the specific language governing permissions and
    limitations under the License.
*/

package ai.picovoice.leopard;

import org.junit.jupiter.api.Test;

import java.nio.file.Paths;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class LeopardPerformanceTest {
    private final String accessKey = System.getProperty("pvTestingAccessKey");
    private final int numTestIterations = Integer.parseInt(System.getProperty("numTestIterations"));
    private final double initPerformanceThresholdSec = Double.parseDouble(
            System.getProperty("initPerformanceThresholdSec")
    );
    private final double procPerformanceThresholdSec = Double.parseDouble(
            System.getProperty("procPerformanceThresholdSec")
    );

    @Test
    void initPerformance() throws Exception {

        long[] perfResults = new long[numTestIterations];
        for (int i = 0; i < numTestIterations + 1; i++) {
            long before = System.nanoTime();
            Leopard leopard = new Leopard.Builder()
                    .setAccessKey(accessKey)
                    .build();

            long initTime = (System.nanoTime() - before);
            if (i > 0) {
                perfResults[i - 1] = initTime;
            }
            leopard.delete();

        }

        long avgPerfNSec = Arrays.stream(perfResults).sum() / numTestIterations;
        double avgPerfSec = Math.round(((double) avgPerfNSec) * 1e-6) / 1000.0;
        System.out.printf("Average init performance: %.3fs\n", avgPerfSec);
        assertTrue(
                avgPerfSec <= initPerformanceThresholdSec,
                String.format(
                        "Expected threshold (%.3fs), init took an average of %.3fs",
                        initPerformanceThresholdSec,
                        avgPerfSec)
        );
    }

    @Test
    void procPerformance() throws Exception {
        Leopard leopard = new Leopard.Builder()
                .setAccessKey(accessKey)
                .build();

        String audioFilePath = Paths.get(System.getProperty("user.dir"))
                .resolve("../../resources/audio_samples/test.wav")
                .toString();

        long[] perfResults = new long[numTestIterations];
        for (int i = 0; i < numTestIterations + 1; i++) {
            long before = System.nanoTime();
            leopard.processFile(audioFilePath);
            long procTime = (System.nanoTime() - before);

            if (i > 0) {
                perfResults[i - 1] = procTime;
            }
        }

        leopard.delete();

        long avgPerfNSec = Arrays.stream(perfResults).sum() / numTestIterations;
        double avgPerfSec = Math.round(((double) avgPerfNSec) * 1e-6) / 1000.0;
        System.out.printf("Average proc performance: %.3fs\n", avgPerfSec);
        assertTrue(
                avgPerfSec <= procPerformanceThresholdSec,
                String.format(
                        "Expected threshold (%.3fs), proc took an average of %.3fs",
                        procPerformanceThresholdSec,
                        avgPerfSec)
        );
    }
}
