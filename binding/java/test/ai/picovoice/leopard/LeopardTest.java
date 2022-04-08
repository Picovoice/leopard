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

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import java.io.File;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.file.Paths;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class LeopardTest {
    private final String referenceTranscript = "MR QUILTER IS THE APOSTLE OF THE MIDDLE CLASSES AND WE ARE GLAD TO WELCOME HIS GOSPEL";
    private Leopard leopard;
    private final String accessKey = System.getProperty("pvTestingAccessKey");

    @AfterEach
    void tearDown() {
        leopard.delete();
    }

    @Test
    void getVersion() throws Exception {
        leopard = new Leopard(
                accessKey,
                Utils.getPackagedLibraryPath(),
                Utils.getPackagedModelPath()
        );

        assertTrue(leopard.getVersion() != null && !leopard.getVersion().equals(""));
    }

    @Test
    void process() throws Exception {
        leopard = new Leopard.Builder()
                .setAccessKey(accessKey)
                .build();

        String audioFilePath = Paths.get(System.getProperty("user.dir"))
                .resolve("../../resources/audio_samples/test.wav")
                .toString();
        File testAudioPath = new File(audioFilePath);

        AudioInputStream audioInputStream = AudioSystem.getAudioInputStream(testAudioPath);
        assertEquals(audioInputStream.getFormat().getFrameRate(), 16000);

        int byteDepth = audioInputStream.getFormat().getFrameSize();
        int frameLength = (int) audioInputStream.getFrameLength();
        byte[] pcm = new byte[frameLength * byteDepth];
        short[] leopardFrame = new short[frameLength];

        audioInputStream.read(pcm);
        ByteBuffer.wrap(pcm).order(ByteOrder.LITTLE_ENDIAN).asShortBuffer().get(leopardFrame);

        String transcript = leopard.process(leopardFrame);

        assertEquals(referenceTranscript, transcript);
    }

    @Test
    void processFile() throws Exception {
        leopard = new Leopard.Builder()
                .setAccessKey(accessKey)
                .build();

        String audioFilePath = Paths.get(System.getProperty("user.dir"))
                .resolve("../../resources/audio_samples/test.wav")
                .toString();

        String transcript = leopard.processFile(audioFilePath);

        assertEquals(referenceTranscript, transcript);
    }
}
