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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Arrays;

import ai.picovoice.leopard.Leopard;
import ai.picovoice.leopard.LeopardException;
import ai.picovoice.leopard.LeopardTranscript;


@RunWith(AndroidJUnit4.class)
public class LeopardTest extends BaseTest {

    private final String transcript = "Mr quilter is the apostle of the middle classes and we are glad to welcome his gospel";
    private final String transcriptWithPunctuation = "Mr. Quilter is the apostle of the middle classes and we are glad to welcome his gospel.";

    @Test
    public void testTranscribeAudioFile() throws LeopardException {
        Leopard leopard = new Leopard.Builder()
                .setAccessKey(accessKey)
                .setModelPath(defaultModelPath)
                .build(appContext);

        File audioFile = new File(testResourcesPath, "audio/test.wav");

        LeopardTranscript result = leopard.processFile(audioFile.getAbsolutePath());
        assertEquals(transcript, result.getTranscriptString());

        leopard.delete();
    }

    @Test
    public void testTranscribeAudioFileWithPunctuation() throws LeopardException {
        Leopard leopard = new Leopard.Builder()
                .setAccessKey(accessKey)
                .setModelPath(defaultModelPath)
                .setEnableAutomaticPunctuation(true)
                .build(appContext);

        File audioFile = new File(testResourcesPath, "audio/test.wav");

        LeopardTranscript result = leopard.processFile(audioFile.getAbsolutePath());
        assertEquals(transcriptWithPunctuation, result.getTranscriptString());

        leopard.delete();
    }

    @Test
    public void testTranscribeAudioData() throws Exception {
        Leopard leopard = new Leopard.Builder()
                .setAccessKey(accessKey)
                .setModelPath(defaultModelPath)
                .build(appContext);

        File audioFile = new File(testResourcesPath, "audio/test.wav");

        FileInputStream audioInputStream = new FileInputStream(audioFile);
        ByteArrayOutputStream audioByteBuffer = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];
        for (int length; (length = audioInputStream.read(buffer)) != -1; ) {
            audioByteBuffer.write(buffer, 0, length);
        }
        byte[] rawData = audioByteBuffer.toByteArray();

        short[] samples = new short[rawData.length / 2];
        ByteBuffer pcmBuff = ByteBuffer.wrap(rawData).order(ByteOrder.LITTLE_ENDIAN);
        pcmBuff.asShortBuffer().get(samples);
        samples = Arrays.copyOfRange(samples, 44, samples.length);

        LeopardTranscript result = leopard.process(samples);
        assertEquals(transcript, result.getTranscriptString());

        leopard.delete();
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
