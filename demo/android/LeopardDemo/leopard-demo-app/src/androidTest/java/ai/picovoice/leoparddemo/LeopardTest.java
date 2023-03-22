/*
    Copyright 2022-2023 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is
    located in the "LICENSE" file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the
    License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
    express or implied. See the License for the specific language governing permissions and
    limitations under the License.
*/

package ai.picovoice.leoparddemo;

import static org.junit.Assert.assertTrue;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import org.junit.Test;
import org.junit.experimental.runners.Enclosed;
import org.junit.runner.RunWith;
import org.junit.runners.Parameterized;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import ai.picovoice.leopard.Leopard;
import ai.picovoice.leopard.LeopardException;
import ai.picovoice.leopard.LeopardTranscript;


@RunWith(Enclosed.class)
public class LeopardTest {

    public static class StandardTests extends BaseTest {

        @Test
        public void testInitFailWithInvalidAccessKey() {
            boolean didFail = false;
            try {
                new Leopard.Builder()
                        .setAccessKey("")
                        .setModelPath(defaultModelPath)
                        .build(appContext);
            } catch (LeopardException e) {
                didFail = true;
            }

            assertTrue(didFail);
        }

        @Test
        public void testInitFailWithMissingAccessKey() {
            boolean didFail = false;
            try {
                new Leopard.Builder()
                        .setModelPath(defaultModelPath)
                        .build(appContext);
            } catch (LeopardException e) {
                didFail = true;
            }

            assertTrue(didFail);
        }

        @Test
        public void testInitFailWithInvalidModelPath() {
            boolean didFail = false;
            File modelPath = new File(testResourcesPath, "bad_path/bad_path.pv");
            try {
                new Leopard.Builder()
                        .setAccessKey(accessKey)
                        .setModelPath(modelPath.getAbsolutePath())
                        .build(appContext);
            } catch (LeopardException e) {
                didFail = true;
            }

            assertTrue(didFail);
        }

        @Test
        public void testInitFailWithMissingModelPath() {
            boolean didFail = false;
            try {
                new Leopard.Builder()
                        .setAccessKey(accessKey)
                        .build(appContext);
            } catch (LeopardException e) {
                didFail = true;
            }

            assertTrue(didFail);
        }

        @Test
        public void getVersion() throws LeopardException {
            Leopard leopard = new Leopard.Builder().setAccessKey(accessKey)
                    .setModelPath(defaultModelPath)
                    .build(appContext);

            assertTrue(leopard.getVersion() != null && !leopard.getVersion().equals(""));

            leopard.delete();
        }

        @Test
        public void getSampleRate() throws LeopardException {
            Leopard leopard = new Leopard.Builder().setAccessKey(accessKey)
                    .setModelPath(defaultModelPath)
                    .build(appContext);

            assertTrue(leopard.getSampleRate() > 0);

            leopard.delete();
        }
    }

    @RunWith(Parameterized.class)
    public static class LanguageTests extends BaseTest {
        @Parameterized.Parameter(value = 0)
        public String language;

        @Parameterized.Parameter(value = 1)
        public String modelFile;

        @Parameterized.Parameter(value = 2)
        public String testAudioFile;

        @Parameterized.Parameter(value = 3)
        public String expectedTranscript;

        @Parameterized.Parameter(value = 4)
        public String[] punctuations;

        @Parameterized.Parameter(value = 5)
        public float errorRate;

        @Parameterized.Parameters(name = "{0}")
        public static Collection<Object[]> initParameters() throws IOException {
            String testDataJsonString = getTestDataString();

            JsonParser parser = new JsonParser();
            JsonObject testDataJson = parser.parse(testDataJsonString).getAsJsonObject();
            JsonArray testParameters = testDataJson.getAsJsonObject("tests").getAsJsonArray("parameters");

            List<Object[]> parameters = new ArrayList<>();
            for (int i = 0; i < testParameters.size(); i++) {
                JsonObject testData = testParameters.get(i).getAsJsonObject();

                String language = testData.get("language").getAsString();
                String audioFile = testData.get("audio_file").getAsString();
                String transcript = testData.get("transcript").getAsString();
                JsonArray punctuations = testData.get("punctuations").getAsJsonArray();
                float errorRate = testData.get("error_rate").getAsFloat();

                String modelFile;
                if (language.equals("en")) {
                    modelFile = "model_files/leopard_params.pv";
                } else {
                    modelFile = String.format("model_files/leopard_params_%s.pv", language);
                }

                String[] paramPunctuations = new String[punctuations.size()];
                for (int j = 0; j < punctuations.size(); j++) {
                    paramPunctuations[j] = punctuations.get(j).getAsString();
                }

                parameters.add(new Object[] {
                        language,
                        modelFile,
                        audioFile,
                        transcript,
                        paramPunctuations,
                        errorRate
                });
            }

            return parameters;
        }


        @Test
        public void testTranscribeAudioFile() throws Exception {
            String modelPath = new File(testResourcesPath, modelFile).getAbsolutePath();
            Leopard leopard = new Leopard.Builder()
                    .setAccessKey(accessKey)
                    .setModelPath(modelPath)
                    .build(appContext);

            File audioFile = new File(testResourcesPath, testAudioFile);
            boolean useCER = language.equals("ja");

            LeopardTranscript result = leopard.processFile(audioFile.getAbsolutePath());

            assertTrue(getWordErrorRate(result.getTranscriptString(), expectedTranscript, useCER) < errorRate);
            validateMetadata(
                    result.getWordArray(),
                    result.getTranscriptString(),
                    (float) readAudioFile(testAudioFile).length / leopard.getSampleRate()
            );

            leopard.delete();
        }

        @Test
        public void testTranscribeAudioFileWithPunctuation() throws Exception {
            String modelPath = new File(testResourcesPath, modelFile).getAbsolutePath();
            Leopard leopard = new Leopard.Builder()
                    .setAccessKey(accessKey)
                    .setModelPath(modelPath)
                    .setEnableAutomaticPunctuation(true)
                    .build(appContext);

            File audioFile = new File(testResourcesPath, testAudioFile);
            boolean useCER = language.equals("ja");

            LeopardTranscript result = leopard.processFile(audioFile.getAbsolutePath());

            String normalizedTranscript = result.getTranscriptString();
            for (String punctuation: punctuations) {
                normalizedTranscript = normalizedTranscript.replace(punctuation, "");
            }

            assertTrue(getWordErrorRate(normalizedTranscript, expectedTranscript, useCER) < errorRate);
            validateMetadata(
                    result.getWordArray(),
                    normalizedTranscript,
                    (float) readAudioFile(testAudioFile).length / leopard.getSampleRate()
            );

            leopard.delete();
        }

        @Test
        public void testTranscribeAudioData() throws Exception {
            String modelPath = new File(testResourcesPath, modelFile).getAbsolutePath();
            Leopard leopard = new Leopard.Builder()
                    .setAccessKey(accessKey)
                    .setModelPath(modelPath)
                    .build(appContext);

            File audioFile = new File(testResourcesPath, testAudioFile);
            short[] pcm = readAudioFile(audioFile.getAbsolutePath());

            LeopardTranscript result = leopard.process(pcm);
            boolean useCER = language.equals("ja");

            assertTrue(getWordErrorRate(result.getTranscriptString(), expectedTranscript, useCER) < errorRate);
            validateMetadata(
                    result.getWordArray(),
                    result.getTranscriptString(),
                    (float) pcm.length / leopard.getSampleRate()
            );

            leopard.delete();
        }
    }
}
