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
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

public class LeopardTest {
    private Leopard leopard;
    private final String accessKey = System.getProperty("pvTestingAccessKey");

    private final LeopardTranscript.Word[] referenceTranscriptMetadata = {
            new LeopardTranscript.Word("Mr", 0.95f, 0.58f, 0.80f),
            new LeopardTranscript.Word("quilter", 0.80f, 0.86f, 1.18f),
            new LeopardTranscript.Word("is", 0.96f, 1.31f, 1.38f),
            new LeopardTranscript.Word("the", 0.90f, 1.44f, 1.50f),
            new LeopardTranscript.Word("apostle", 0.79f, 1.57f, 2.08f),
            new LeopardTranscript.Word("of", 0.98f, 2.18f, 2.24f),
            new LeopardTranscript.Word("the", 0.98f, 2.30f, 2.34f),
            new LeopardTranscript.Word("middle", 0.97f, 2.40f, 2.59f),
            new LeopardTranscript.Word("classes", 0.98f, 2.69f, 3.17f),
            new LeopardTranscript.Word("and", 0.95f, 3.36f, 3.46f),
            new LeopardTranscript.Word("we", 0.96f, 3.52f, 3.55f),
            new LeopardTranscript.Word("are", 0.97f, 3.65f, 3.65f),
            new LeopardTranscript.Word("glad", 0.93f, 3.74f, 4.03f),
            new LeopardTranscript.Word("to", 0.97f, 4.10f, 4.16f),
            new LeopardTranscript.Word("welcome", 0.89f, 4.22f, 4.58f),
            new LeopardTranscript.Word("his", 0.96f, 4.67f, 4.83f),
            new LeopardTranscript.Word("gospel", 0.93f, 4.93f, 5.38f),
    };

    @AfterEach
    void tearDown() {
        leopard.delete();
    }

    @Test
    void getVersion() throws Exception {
        leopard = new Leopard.Builder()
                .setAccessKey(accessKey)
                .build();

        assertTrue(leopard.getVersion() != null && !leopard.getVersion().equals(""));
    }

    @ParameterizedTest(name = "test process with automatic punctuation set to ''{0}''")
    @MethodSource("transcribeProvider")
    void process(boolean enableAutomaticPunctuation, String referenceTranscript) throws Exception {
        leopard = new Leopard.Builder()
                .setAccessKey(accessKey)
                .setEnableAutomaticPunctuation(enableAutomaticPunctuation)
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

        LeopardTranscript result = leopard.process(leopardFrame);

        assertEquals(referenceTranscript, result.getTranscriptString());
    }

    @ParameterizedTest(name = "test processFile with automatic punctuation set to ''{0}''")
    @MethodSource("transcribeProvider")
    void processFile(boolean enableAutomaticPunctuation, String referenceTranscript) throws Exception {

        leopard = new Leopard.Builder()
                .setAccessKey(accessKey)
                .setEnableAutomaticPunctuation(enableAutomaticPunctuation)
                .build();

        String audioFilePath = Paths.get(System.getProperty("user.dir"))
                .resolve("../../resources/audio_samples/test.wav")
                .toString();

        LeopardTranscript result = leopard.processFile(audioFilePath);

        assertEquals(referenceTranscript, result.getTranscriptString());
    }

    private static Stream<Arguments> transcribeProvider() {
        return Stream.of(
                Arguments.of(true, "Mr. Quilter is the apostle of the middle classes and we are glad to welcome his gospel."),
                Arguments.of(false, "Mr quilter is the apostle of the middle classes and we are glad to welcome his gospel")
        );
    }

    @Test
    void testMetadata() throws Exception {

        leopard = new Leopard.Builder()
                .setAccessKey(accessKey)
                .build();

        String audioFilePath = Paths.get(System.getProperty("user.dir"))
                .resolve("../../resources/audio_samples/test.wav")
                .toString();

        LeopardTranscript result = leopard.processFile(audioFilePath);

        float eps = 0.01f;
        LeopardTranscript.Word[] words = result.getWordArray();
        for (int i = 0; i < words.length; i++) {
            assertEquals(referenceTranscriptMetadata[i].getWord(), words[i].getWord());
            assertTrue(Math.abs(referenceTranscriptMetadata[i].getStartSec() - words[i].getStartSec()) < eps);
            assertTrue(Math.abs(referenceTranscriptMetadata[i].getEndSec() - words[i].getEndSec()) < eps);
            assertTrue(Math.abs(referenceTranscriptMetadata[i].getConfidence() - words[i].getConfidence()) < eps);
        }
    }
}
