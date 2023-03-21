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

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.apache.commons.text.similarity.LevenshteinDistance;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import java.io.File;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class LeopardTest {
    private final String accessKey = System.getProperty("pvTestingAccessKey");
    private Leopard leopard;

    public static String appendLanguage(String s, String language) {
        if (language.equals("en")) {
            return s;
        }
        return s + "_" + language;
    }

    public static float getCharacterErrorRate(String transcript, String expectedTranscript) {
        return (float) LevenshteinDistance
                .getDefaultInstance()
                .apply(transcript, expectedTranscript) / (float) expectedTranscript.length();
    }

    private static JsonObject loadTestData() throws IOException {
        final Path testDataPath = Paths.get(System.getProperty("user.dir"))
                .resolve("../../resources/test")
                .resolve("test_data.json");
        final String testDataContent = new String(Files.readAllBytes(testDataPath));
        return JsonParser.parseString(testDataContent).getAsJsonObject();
    }

    private static short[] readAudioFile(String testAudioPath) throws Exception {

        File testAudioFile = new File(testAudioPath);
        AudioInputStream audioInputStream = AudioSystem.getAudioInputStream(testAudioFile);

        int byteDepth = audioInputStream.getFormat().getFrameSize();
        int frameLength = (int) audioInputStream.getFrameLength();
        byte[] bytes = new byte[frameLength * byteDepth];
        short[] pcm = new short[frameLength];

        audioInputStream.read(bytes);
        ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).asShortBuffer().get(pcm);
        return pcm;
    }

    private static Stream<Arguments> transcribeProvider() throws IOException {

        final JsonObject testDataJson = loadTestData();

        final JsonArray testParameters = testDataJson
                .getAsJsonObject("tests")
                .getAsJsonArray("parameters");

        final ArrayList<Arguments> testArgs = new ArrayList<>();
        for (int i = 0; i < testParameters.size(); i++) {
            final JsonObject testData = testParameters.get(i).getAsJsonObject();
            final String language = testData.get("language").getAsString();
            final String testAudioFile = testData.get("audio_file").getAsString();
            final String transcript = testData.get("audio_file").getAsString();
            final float errorRate = testData.get("error_rate").getAsFloat();

            testArgs.add(Arguments.of(
                    language,
                    testAudioFile,
                    transcript,
                    true,
                    errorRate)
            );

            String transcriptWithoutPunctuation = transcript;
            final JsonArray punctuations = testData.get("punctuations").getAsJsonArray();
            for (int j = 0; j < punctuations.size(); j++) {
                String punctuation = punctuations.get(j).getAsString();
                transcriptWithoutPunctuation = transcriptWithoutPunctuation.replace(punctuation, "");
            }
            testArgs.add(Arguments.of(
                    language,
                    testAudioFile,
                    transcriptWithoutPunctuation,
                    false,
                    errorRate)
            );
        }
        return testArgs.stream();
    }

    @AfterEach
    void tearDown() {
        leopard.delete();
    }

    void validateMetadata(LeopardTranscript.Word[] words, String transcript, float audioLength) {
        for (int i = 0; i < words.length; i++) {
            assertTrue(transcript.contains(words[i].getWord()));
            assertTrue(words[i].getStartSec() > 0);
            assertTrue(words[i].getStartSec() < words[i].getEndSec());
            if (i < words.length - 1) {
                assertTrue(words[i].getEndSec() <= words[i + 1].getStartSec());
            } else {
                assertTrue(words[i].getEndSec() <= audioLength);
            }
            assertTrue(words[i].getConfidence() >= 0.0f && words[i].getConfidence() <= 1.0f);
        }
    }

    @Test
    void getVersion() throws Exception {
        leopard = new Leopard.Builder()
                .setAccessKey(accessKey)
                .build();

        assertTrue(leopard.getVersion() != null && !leopard.getVersion().equals(""));
    }

    @Test
    void getSampleRate() throws Exception {
        leopard = new Leopard.Builder()
                .setAccessKey(accessKey)
                .build();
        assertTrue(leopard.getSampleRate() > 0);
    }

    @ParameterizedTest(name = "test process data for ''{0}'' with punctuation ''{3}''")
    @MethodSource("transcribeProvider")
    void process(
            String language,
            String testAudioFile,
            String referenceTranscript,
            boolean enableAutomaticPunctuation,
            float targetErrorRate) throws Exception {
        String modelPath = Paths.get(System.getProperty("user.dir"))
                .resolve(String.format("../../lib/common/%s.pv", appendLanguage("leopard_params", language)))
                .toString();

        leopard = new Leopard.Builder()
                .setAccessKey(accessKey)
                .setModelPath(modelPath)
                .setEnableAutomaticPunctuation(enableAutomaticPunctuation)
                .build();

        String testAudioPath = Paths.get(System.getProperty("user.dir"))
                .resolve(String.format("../../resources/audio_samples/%s", testAudioFile))
                .toString();

        short[] pcm = readAudioFile(testAudioPath);
        LeopardTranscript result = leopard.process(pcm);

        assertTrue(getCharacterErrorRate(result.getTranscriptString(), referenceTranscript) < targetErrorRate);
        validateMetadata(
                result.getWordArray(),
                result.getTranscriptString(),
                (float) pcm.length / LeopardNative.getSampleRate());
    }

    @ParameterizedTest(name = "test process file for ''{0}'' with punctuation ''{3}''")
    @MethodSource("transcribeProvider")
    void processFile(
            String language,
            String testAudioFile,
            String referenceTranscript,
            boolean enableAutomaticPunctuation,
            float targetErrorRate) throws Exception {

        String modelPath = Paths.get(System.getProperty("user.dir"))
                .resolve(String.format("../../lib/common/%s.pv", appendLanguage("leopard_params", language)))
                .toString();

        leopard = new Leopard.Builder()
                .setAccessKey(accessKey)
                .setModelPath(modelPath)
                .setEnableAutomaticPunctuation(enableAutomaticPunctuation)
                .build();

        String testAudioPath = Paths.get(System.getProperty("user.dir"))
                .resolve(String.format("../../resources/audio_samples/%s", testAudioFile))
                .toString();

        LeopardTranscript result = leopard.processFile(testAudioPath);
        assertTrue(getCharacterErrorRate(result.getTranscriptString(), referenceTranscript) < targetErrorRate);
        validateMetadata(
                result.getWordArray(),
                result.getTranscriptString(),
                (float) readAudioFile(testAudioPath).length / LeopardNative.getSampleRate());
    }

}
