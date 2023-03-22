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

import android.content.Context;
import android.content.res.AssetManager;

import androidx.test.platform.app.InstrumentationRegistry;

import com.microsoft.appcenter.espresso.Factory;
import com.microsoft.appcenter.espresso.ReportHelper;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import ai.picovoice.leopard.LeopardTranscript;

public class BaseTest {

    @Rule
    public ReportHelper reportHelper = Factory.getReportHelper();

    Context testContext;
    Context appContext;
    AssetManager assetManager;
    String testResourcesPath;
    String defaultModelPath;

    String accessKey;

    @After
    public void TearDown() {
        reportHelper.label("Stopping App");
    }

    @Before
    public void Setup() throws IOException {
        testContext = InstrumentationRegistry.getInstrumentation().getContext();
        appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assetManager = testContext.getAssets();
        extractAssetsRecursively("test_resources");
        testResourcesPath = new File(appContext.getFilesDir(), "test_resources").getAbsolutePath();
        defaultModelPath = new File(testResourcesPath, "leopard_params.pv").getAbsolutePath();

        accessKey = appContext.getString(R.string.pvTestingAccessKey);
    }

    public static String getTestDataString() throws IOException {
        Context testContext = InstrumentationRegistry.getInstrumentation().getContext();
        AssetManager assetManager = testContext.getAssets();

        InputStream is = new BufferedInputStream(assetManager.open("test_resources/test_data.json"), 256);
        ByteArrayOutputStream result = new ByteArrayOutputStream();

        byte[] buffer = new byte[256];
        int bytesRead;
        while ((bytesRead = is.read(buffer)) != -1) {
            result.write(buffer, 0, bytesRead);
        }

        return result.toString("UTF-8");
    }

    protected void validateMetadata(LeopardTranscript.Word[] words, String transcript, float audioLength) {
        String normTranscript = transcript.toUpperCase();
        for (int i = 0; i < words.length; i++) {
            assertTrue(normTranscript.contains(words[i].getWord().toUpperCase()));
            assertTrue(words[i].getStartSec() > 0);
            assertTrue(words[i].getStartSec() <= words[i].getEndSec());
            if (i < words.length - 1) {
                assertTrue(words[i].getEndSec() <= words[i + 1].getStartSec());
            } else {
                assertTrue(words[i].getEndSec() <= audioLength);
            }
            assertTrue(words[i].getConfidence() >= 0.0f && words[i].getConfidence() <= 1.0f);
        }
    }

    public static float getWordErrorRate(String transcript, String expectedTranscript, boolean useCER) {
        String splitter = (useCER) ? "" : " ";
        return (float) editDistance(transcript.split(splitter), expectedTranscript.split(splitter)) / (float) transcript.length();
    }

    private static int editDistance(String[] words1, String[] words2) {
        int[][] res = new int[words2.length + 1][words1.length + 1];
        for (int i = 0; i <= words1.length; i++) {
            res[0][i] = i;
        }
        for (int j = 0; j <= words2.length; j++) {
            res[j][0] = j;
        }
        for (int j = 1; j <= words2.length; j++) {
            for (int i = 1; i <= words1.length; i++) {
                res[i][j] = Math.min(
                        Math.min(
                                res[j][i - 1] + 1,
                                res[j - 1][i] + 1),
                        res[j - 1][i - 1] + (words1[i - 1].equalsIgnoreCase(words2[j - 1]) ? 0 : 1)
                );
            }
        }
        return res[words2.length][words1.length];
    }

    private void extractAssetsRecursively(String path) throws IOException {
        String[] list = assetManager.list(path);
        if (list.length > 0) {
            File outputFile = new File(appContext.getFilesDir(), path);
            if (!outputFile.exists()) {
                outputFile.mkdirs();
            }

            for (String file : list) {
                String filepath = path + "/" + file;
                extractAssetsRecursively(filepath);
            }
        } else {
            extractTestFile(path);
        }
    }

    private void extractTestFile(String filepath) throws IOException {

        InputStream is = new BufferedInputStream(assetManager.open(filepath), 256);
        File absPath = new File(appContext.getFilesDir(), filepath);
        OutputStream os = new BufferedOutputStream(new FileOutputStream(absPath), 256);
        int r;
        while ((r = is.read()) != -1) {
            os.write(r);
        }
        os.flush();

        is.close();
        os.close();
    }
}
