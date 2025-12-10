/*
    Copyright 2022-2025 Picovoice Inc.

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

import ai.picovoice.leopard.Leopard;
import ai.picovoice.leopard.LeopardException;

import androidx.test.ext.junit.runners.AndroidJUnit4;

@RunWith(AndroidJUnit4.class)
public class StandardTests extends BaseTest {

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

    @Test
    public void testErrorStack() {
        String[] error = {};
        try {
            new Leopard.Builder()
                    .setAccessKey("invalid")
                    .setModelPath(defaultModelPath)
                    .build(appContext);
        } catch (LeopardException e) {
            error = e.getMessageStack();
        }

        assertTrue(0 < error.length);
        assertTrue(error.length <= 8);

        try {
            new Leopard.Builder()
                    .setAccessKey("invalid")
                    .setModelPath(defaultModelPath)
                    .build(appContext);
        } catch (LeopardException e) {
            for (int i = 0; i < error.length; i++) {
                assertEquals(e.getMessageStack()[i], error[i]);
            }
        }
    }

    @Test
    public void testInitFailWithInvalidDevice() {
        boolean didFail = false;
        try {
            new Falcon.Builder()
                    .setAccessKey(accessKey)
                    .setDevice("invalid:9")
                    .build(appContext);
        } catch (FalconException e) {
            didFail = true;
        }

        assertTrue(didFail);
    }

    @Test
    public void testGetAvailableDevices() throws FalconException {
        String[] availableDevices = Falcon.getAvailableDevices();
        assertTrue(availableDevices.length > 0);
        for (String d : availableDevices) {
            assertTrue(d != null && d.length() > 0);
        }
    }
}