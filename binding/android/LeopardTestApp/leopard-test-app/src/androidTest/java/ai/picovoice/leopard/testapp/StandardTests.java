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

import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.File;
import java.io.IOException;

import ai.picovoice.leopard.Leopard;
import ai.picovoice.leopard.LeopardException;

import androidx.test.ext.junit.runners.AndroidJUnit4;

@RunWith(AndroidJUnit4.class)
public class StandardTests extends BaseTest {

    @Test
    public void testInitFailWithInvalidAccessKey() throws IOException {
        boolean didFail = false;
        String modelPath = getModelFilepath(defaultModelFile);
        try {
            new Leopard.Builder()
                    .setAccessKey("")
                    .setModelPath(modelPath)
                    .build(appContext);
        } catch (LeopardException e) {
            didFail = true;
        }

        assertTrue(didFail);
    }

    @Test
    public void testInitFailWithMissingAccessKey() throws IOException {
        boolean didFail = false;
        String modelPath = getModelFilepath(defaultModelFile);
        try {
            new Leopard.Builder()
                    .setModelPath(modelPath)
                    .build(appContext);
        } catch (LeopardException e) {
            didFail = true;
        }

        assertTrue(didFail);
    }

    @Test
    public void testInitFailWithInvalidModelPath() {
        boolean didFail = false;
        String testResourcesPath = new File(appContext.getFilesDir(), "test_resources").getAbsolutePath();
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
    public void getVersion() throws LeopardException, IOException {
        String modelPath = getModelFilepath(defaultModelFile);
        Leopard leopard = new Leopard.Builder().setAccessKey(accessKey)
                .setModelPath(modelPath)
                .build(appContext);

        assertTrue(leopard.getVersion() != null && !leopard.getVersion().equals(""));

        leopard.delete();
    }

    @Test
    public void getSampleRate() throws LeopardException, IOException {
        String modelPath = getModelFilepath(defaultModelFile);
        Leopard leopard = new Leopard.Builder().setAccessKey(accessKey)
                .setModelPath(modelPath)
                .build(appContext);

        assertTrue(leopard.getSampleRate() > 0);

        leopard.delete();
    }

    @Test
    public void testErrorStack() throws IOException {
        String[] error = {};
        String modelPath = getModelFilepath(defaultModelFile);
        try {
            new Leopard.Builder()
                    .setAccessKey("invalid")
                    .setModelPath(modelPath)
                    .build(appContext);
        } catch (LeopardException e) {
            error = e.getMessageStack();
        }

        assertTrue(0 < error.length);
        assertTrue(error.length <= 8);

        try {
            new Leopard.Builder()
                    .setAccessKey("invalid")
                    .setModelPath(modelPath)
                    .build(appContext);
        } catch (LeopardException e) {
            for (int i = 0; i < error.length; i++) {
                assertEquals(e.getMessageStack()[i], error[i]);
            }
        }
    }
}