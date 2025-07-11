/*
    Copyright 2022-2023 Picovoice Inc.

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
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.stream.Stream;

import java.util.Locale;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class LeopardTest {
    private final String accessKey = System.getProperty("pvTestingAccessKey");
    private Leopard leopard;

    private static String appendLanguage(String s, String language) {
        if (language.equals("en")) {
            return s;
        }
        return s + "_" + language;
    }

    private static float getErrorRate(String transcript, String expectedTranscript) {
        return (float) LevenshteinDistance
                .getDefaultInstance()
                .apply(transcript, expectedTranscript) / (float) expectedTranscript.length();
    }

    private static ProcessTestData[] loadProcessTestData() throws IOException {
        final Path testDataPath = Paths.get(System.getProperty("user.dir"))
                .resolve("../../resources/.test")
                .resolve("test_data.json");
        final String testDataContent = new String(Files.readAllBytes(testDataPath), StandardCharsets.UTF_8);
        final JsonObject testDataJson = JsonParser.parseString(testDataContent).getAsJsonObject();

        final JsonArray testParameters = testDataJson
                .getAsJsonObject("tests")
                .getAsJsonArray("language_tests");

        final ProcessTestData[] processTestData = new ProcessTestData[testParameters.size()];
        for (int i = 0; i < testParameters.size(); i++) {
            final JsonObject testData = testParameters.get(i).getAsJsonObject();
            final String language = testData.get("language").getAsString();
            final String testAudioFile = testData.get("audio_file").getAsString();
            final String transcript = testData.get("transcript").getAsString();
            final String transcriptWithPunctuation = testData.get("transcript_with_punctuation").getAsString();
            final float errorRate = testData.get("error_rate").getAsFloat();

            final JsonArray wordsJson = testData.getAsJsonArray("words");
            final LeopardTranscript.Word[] words = new LeopardTranscript.Word[wordsJson.size()];
            for (int j = 0; j < wordsJson.size(); j++) {
                final JsonObject wordJson = wordsJson.get(j).getAsJsonObject();
                words[j] = new LeopardTranscript.Word(
                        wordJson.get("word").getAsString(),
                        wordJson.get("confidence").getAsFloat(),
                        wordJson.get("start_sec").getAsFloat(),
                        wordJson.get("end_sec").getAsFloat(),
                        wordJson.get("speaker_tag").getAsInt());
            }
            processTestData[i] = new ProcessTestData(
                    language,
                    testAudioFile,
                    transcript,
                    transcriptWithPunctuation,
                    errorRate,
                    words);
        }
        return processTestData;
    }

    private static DiarizationTestData[] loadDiarizationTestData() throws IOException {
        final Path testDataPath = Paths.get(System.getProperty("user.dir"))
                .resolve("../../resources/.test")
                .resolve("test_data.json");
        final String testDataContent = new String(Files.readAllBytes(testDataPath), StandardCharsets.UTF_8);
        final JsonObject testDataJson = JsonParser.parseString(testDataContent).getAsJsonObject();

        final JsonArray testParameters = testDataJson
                .getAsJsonObject("tests")
                .getAsJsonArray("diarization_tests");

        final DiarizationTestData[] diarizationTestData = new DiarizationTestData[testParameters.size()];
        for (int i = 0; i < testParameters.size(); i++) {
            final JsonObject testData = testParameters.get(i).getAsJsonObject();
            final String language = testData.get("language").getAsString();
            final String testAudioFile = testData.get("audio_file").getAsString();

            final JsonArray wordsJson = testData.getAsJsonArray("words");
            final LeopardTranscript.Word[] words = new LeopardTranscript.Word[wordsJson.size()];
            for (int j = 0; j < wordsJson.size(); j++) {
                final JsonObject wordJson = wordsJson.get(j).getAsJsonObject();
                words[j] = new LeopardTranscript.Word(
                        wordJson.get("word").getAsString(),
                        0,
                        0,
                        0,
                        wordJson.get("speaker_tag").getAsInt());
            }
            diarizationTestData[i] = new DiarizationTestData(
                    language,
                    testAudioFile,
                    words);
        }
        return diarizationTestData;
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

    private static Stream<Arguments> processTestProvider() throws IOException {
        final ProcessTestData[] processTestData = loadProcessTestData();
        final ArrayList<Arguments> testArgs = new ArrayList<>();
        for (ProcessTestData processTestDataItem : processTestData) {
            testArgs.add(Arguments.of(
                    processTestDataItem.language,
                    processTestDataItem.audioFile,
                    processTestDataItem.transcript,
                    false,
                    false,
                    processTestDataItem.errorRate,
                    processTestDataItem.words));
        }

        return testArgs.stream();
    }

    private static Stream<Arguments> processFileTestProvider() throws IOException {
        final ProcessTestData[] processTestData = loadProcessTestData();
        final ArrayList<Arguments> testArgs = new ArrayList<>();
        for (ProcessTestData processTestDataItem : processTestData) {
            testArgs.add(Arguments.of(
                    processTestDataItem.language,
                    processTestDataItem.audioFile,
                    processTestDataItem.transcript,
                    false,
                    false,
                    processTestDataItem.errorRate,
                    processTestDataItem.words));
            testArgs.add(Arguments.of(
                    processTestDataItem.language,
                    processTestDataItem.audioFile,
                    processTestDataItem.transcriptWithPunctuation,
                    true,
                    false,
                    processTestDataItem.errorRate,
                    processTestDataItem.words));
            testArgs.add(Arguments.of(
                    processTestDataItem.language,
                    processTestDataItem.audioFile,
                    processTestDataItem.transcript,
                    false,
                    true,
                    processTestDataItem.errorRate,
                    processTestDataItem.words));
        }

        return testArgs.stream();
    }

    private static Stream<Arguments> diarizationTestProvider() throws IOException {
        final DiarizationTestData[] diarizationTestData = loadDiarizationTestData();
        final ArrayList<Arguments> testArgs = new ArrayList<>();
        for (DiarizationTestData diarizationTestDataItem : diarizationTestData) {
            testArgs.add(Arguments.of(
                    diarizationTestDataItem.language,
                    diarizationTestDataItem.audioFile,
                    diarizationTestDataItem.words));
        }

        return testArgs.stream();
    }

    @AfterEach
    void tearDown() {
        leopard.delete();
    }

    void validateMetadata(
            LeopardTranscript.Word[] words,
            LeopardTranscript.Word[] referenceWords,
            boolean enableDiarization) {
        assertEquals(words.length, referenceWords.length);
        for (int i = 0; i < words.length; i++) {
            assertEquals(
                    words[i].getWord().toUpperCase(Locale.ENGLISH),
                    referenceWords[i].getWord().toUpperCase(Locale.ENGLISH)
            );
            assertEquals(words[i].getStartSec(), referenceWords[i].getStartSec(), 0.1);
            assertEquals(words[i].getEndSec(), referenceWords[i].getEndSec(), 0.1);
            assertEquals(words[i].getConfidence(), referenceWords[i].getConfidence(), 0.1);
            if (enableDiarization) {
                assertEquals(words[i].getSpeakerTag(), referenceWords[i].getSpeakerTag());
            } else {
                assertEquals(words[i].getSpeakerTag(), -1);
            }
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

    @ParameterizedTest(name = "test process data for ''{0}'' with punctuation ''{3}'' and diarization ''{4}''")
    @MethodSource("processTestProvider")
    void process(
            String language,
            String testAudioFile,
            String referenceTranscript,
            boolean enableAutomaticPunctuation,
            boolean enableDiarization,
            float targetErrorRate,
            LeopardTranscript.Word[] referenceWords) throws Exception {
        String modelPath = Paths.get(System.getProperty("user.dir"))
                .resolve(String.format("../../lib/common/%s.pv", appendLanguage("leopard_params", language)))
                .toString();

        leopard = new Leopard.Builder()
                .setAccessKey(accessKey)
                .setModelPath(modelPath)
                .setEnableAutomaticPunctuation(enableAutomaticPunctuation)
                .setEnableDiarization(enableDiarization)
                .build();

        String testAudioPath = Paths.get(System.getProperty("user.dir"))
                .resolve(String.format("../../resources/audio_samples/%s", testAudioFile))
                .toString();
        short[] pcm = readAudioFile(testAudioPath);
        LeopardTranscript result = leopard.process(pcm);

        assertTrue(getErrorRate(result.getTranscriptString(), referenceTranscript) < targetErrorRate);
        validateMetadata(
                result.getWordArray(),
                referenceWords,
                enableDiarization);
    }

    @ParameterizedTest(name = "test process file for ''{0}'' with punctuation ''{3}'' and diarization ''{4}''")
    @MethodSource("processFileTestProvider")
    void processFile(
            String language,
            String testAudioFile,
            String referenceTranscript,
            boolean enableAutomaticPunctuation,
            boolean enableDiarization,
            float targetErrorRate,
            LeopardTranscript.Word[] referenceWords) throws Exception {

        String modelPath = Paths.get(System.getProperty("user.dir"))
                .resolve(String.format("../../lib/common/%s.pv", appendLanguage("leopard_params", language)))
                .toString();

        leopard = new Leopard.Builder()
                .setAccessKey(accessKey)
                .setModelPath(modelPath)
                .setEnableAutomaticPunctuation(enableAutomaticPunctuation)
                .setEnableDiarization(enableDiarization)
                .build();

        String testAudioPath = Paths.get(System.getProperty("user.dir"))
                .resolve(String.format("../../resources/audio_samples/%s", testAudioFile))
                .toString();

        LeopardTranscript result = leopard.processFile(testAudioPath);
        assertTrue(getErrorRate(result.getTranscriptString(), referenceTranscript) < targetErrorRate);
        validateMetadata(
                result.getWordArray(),
                referenceWords,
                enableDiarization);
    }

    @ParameterizedTest(name = "test diarization for ''{0}''")
    @MethodSource("diarizationTestProvider")
    void diarization(
            String language,
            String testAudioFile,
            LeopardTranscript.Word[] referenceWords) throws Exception {

        String modelPath = Paths.get(System.getProperty("user.dir"))
                .resolve(String.format("../../lib/common/%s.pv", appendLanguage("leopard_params", language)))
                .toString();

        leopard = new Leopard.Builder()
                .setAccessKey(accessKey)
                .setModelPath(modelPath)
                .setEnableDiarization(true)
                .build();

        String testAudioPath = Paths.get(System.getProperty("user.dir"))
                .resolve(String.format("../../resources/audio_samples/%s", testAudioFile))
                .toString();

        LeopardTranscript result = leopard.processFile(testAudioPath);
        LeopardTranscript.Word[] words = result.getWordArray();
        assertEquals(result.getWordArray().length, referenceWords.length);
        for (int i = 0; i < words.length; i++) {
            assertEquals(
                    words[i].getWord().toUpperCase(Locale.ENGLISH),
                    referenceWords[i].getWord().toUpperCase(Locale.ENGLISH)
            );
            assertEquals(words[i].getSpeakerTag(), referenceWords[i].getSpeakerTag());
        }
    }

    private static class ProcessTestData {
        public final String language;
        public final String audioFile;
        public final String transcript;
        public final String transcriptWithPunctuation;
        public final float errorRate;
        public final LeopardTranscript.Word[] words;

        public ProcessTestData(
                String language,
                String audioFile,
                String transcript,
                String transcriptWithPunctuation,
                float errorRate,
                LeopardTranscript.Word[] words) {
            this.language = language;
            this.audioFile = audioFile;
            this.transcript = transcript;
            this.transcriptWithPunctuation = transcriptWithPunctuation;
            this.errorRate = errorRate;
            this.words = words;
        }
    }

    private static class DiarizationTestData {
        public final String language;
        public final String audioFile;
        public final LeopardTranscript.Word[] words;

        public DiarizationTestData(
                String language,
                String audioFile,
                LeopardTranscript.Word[] words) {
            this.language = language;
            this.audioFile = audioFile;
            this.words = words;
        }
    }
}
