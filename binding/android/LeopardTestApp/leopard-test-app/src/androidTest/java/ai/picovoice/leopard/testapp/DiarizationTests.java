/*
    Copyright 2022-2024 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is
    located in the "LICENSE" file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the
    License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
    express or implied. See the License for the specific language governing permissions and
    limitations under the License.
*/

package ai.picovoice.leopard.testapp;

import static org.junit.Assert.*;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.Parameterized;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import ai.picovoice.leopard.Leopard;
import ai.picovoice.leopard.LeopardTranscript;

@RunWith(Parameterized.class)
public class DiarizationTests extends BaseTest {
    @Parameterized.Parameter(value = 0)
    public String language;

    @Parameterized.Parameter(value = 1)
    public String modelFile;

    @Parameterized.Parameter(value = 2)
    public String testAudioFile;

    @Parameterized.Parameter(value = 3)
    public LeopardTranscript.Word[] expectedWords;

    @Parameterized.Parameters(name = "{0}")
    public static Collection<Object[]> initParameters() throws IOException {
        String testDataJsonString = getTestDataString();

        JsonParser parser = new JsonParser();
        JsonObject testDataJson = parser.parse(testDataJsonString).getAsJsonObject();
        JsonArray languageTests = testDataJson
                .getAsJsonObject("tests")
                .getAsJsonArray("diarization_tests");

        List<Object[]> parameters = new ArrayList<>();
        for (int i = 0; i < languageTests.size(); i++) {
            JsonObject testData = languageTests.get(i).getAsJsonObject();

            String language = testData.get("language").getAsString();
            String testAudioFile = testData.get("audio_file").getAsString();
            JsonArray words = testData.get("words").getAsJsonArray();

            String modelFile;
            if (language.equals("en")) {
                modelFile = "leopard_params.pv";
            } else {
                modelFile = String.format("leopard_params_%s.pv", language);
            }

            LeopardTranscript.Word[] paramWords = new LeopardTranscript.Word[words.size()];
            for (int j = 0; j < words.size(); j++) {
                JsonObject wordObject = words.get(j).getAsJsonObject();

                String word = wordObject.get("word").getAsString();
                int speakerTag = wordObject.get("speaker_tag").getAsInt();

                paramWords[j] = new LeopardTranscript.Word(
                        word,
                        0.f,
                        0.f,
                        0.f,
                        speakerTag
                );
            }

            parameters.add(new Object[]{
                    language,
                    modelFile,
                    testAudioFile,
                    paramWords
            });
        }

        return parameters;
    }

    @Test
    public void testDiarizationMultipleSpeakers() throws Exception {
        String modelPath = getModelFilepath(modelFile);
        Leopard leopard = new Leopard.Builder()
                .setAccessKey(accessKey)
                .setModelPath(modelPath)
                .setEnableDiarization(true)
                .build(appContext);

        File audioFile = new File(getAudioFilepath(testAudioFile));
        short[] pcm = readAudioFile(audioFile.getAbsolutePath());

        LeopardTranscript result = leopard.process(pcm);

        assertEquals(result.getWordArray().length, expectedWords.length);
        for (int i = 0; i < result.getWordArray().length; i++) {
            assertEquals(result.getWordArray()[i].getWord(), expectedWords[i].getWord());
            assertEquals(result.getWordArray()[i].getSpeakerTag(), expectedWords[i].getSpeakerTag());
        }
        leopard.delete();
    }
}
