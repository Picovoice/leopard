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

import androidx.test.platform.app.InstrumentationRegistry;

import com.microsoft.appcenter.espresso.Factory;
import com.microsoft.appcenter.espresso.ReportHelper;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

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
