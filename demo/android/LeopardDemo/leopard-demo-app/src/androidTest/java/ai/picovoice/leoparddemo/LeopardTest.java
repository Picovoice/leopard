/*
    Copyright 2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is
    located in the "LICENSE" file accompanying this source.
    
    Unless required by applicable law or agreed to in writing, software distributed under the
    License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
    express or implied. See the License for the specific language governing permissions and
    limitations under the License.
*/

package ai.picovoice.leoparddemo;

import android.content.Context;
import android.content.res.AssetManager;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import com.microsoft.appcenter.espresso.Factory;
import com.microsoft.appcenter.espresso.ReportHelper;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.file.Files;
import java.util.Arrays;

import ai.picovoice.leopard.Leopard;
import ai.picovoice.leopard.LeopardException;
import static org.junit.Assert.assertTrue;


@RunWith(AndroidJUnit4.class)
public class LeopardTest {

    @Rule
    public ReportHelper reportHelper = Factory.getReportHelper();
    Context testContext;
    Context appContext;
    AssetManager assetManager;
    String testResourcesPath;
    String defaultModelPath;

    String accessKey = "";

    private final String transcript = "MR QUILTER IS THE APOSTLE OF THE MIDDLE CLASSES AND WE ARE GLAD TO WELCOME HIS GOSPEL";

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
        defaultModelPath = new File(appContext.getFilesDir(), "leopard_params.pv").getAbsolutePath();

        accessKey = appContext.getString(R.string.pvTestingAccessKey);
    }

    @Test
    public void testTranscribeAudioFile() throws LeopardException {
        Leopard leopard = new Leopard.Builder(accessKey)
                .setModelPath(defaultModelPath)
                .build(appContext);

        File audioFile = new File(testResourcesPath, "audio/test.wav");

        String result = leopard.processFile(audioFile.getAbsolutePath());
        assertTrue(result.equals(transcript));

        leopard.delete();
    }

    @Test
    public void testTranscribeAudioData() throws Exception {
        Leopard leopard = new Leopard.Builder(accessKey)
            .setModelPath(defaultModelPath)
            .build(appContext);

        File audioFile = new File(testResourcesPath, "audio/test.wav");
        byte[] rawData = Files.readAllBytes(audioFile.toPath());
        short[] samples = new short[rawData.length / 2];
        ByteBuffer pcmBuff = ByteBuffer.wrap(rawData).order(ByteOrder.LITTLE_ENDIAN);
        pcmBuff.asShortBuffer().get(samples);
        samples = Arrays.copyOfRange(samples, 44, samples.length);

        String result = leopard.process(samples);
        assertTrue(result.equals(transcript));

        leopard.delete();
    }

    @Test
    public void getVersion() throws LeopardException {
        Leopard leopard = new Leopard.Builder(accessKey)
            .setModelPath(defaultModelPath)
            .build(appContext);

        assertTrue(leopard.getVersion() != null && !leopard.getVersion().equals(""));

        leopard.delete();
    }

    @Test
    public void getSampleRate() throws LeopardException {
        Leopard leopard = new Leopard.Builder(accessKey)
            .setModelPath(defaultModelPath)
            .build(appContext);

        assertTrue(leopard.getSampleRate() > 0);

        leopard.delete();
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
