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

import android.content.Context;
import android.content.res.Resources;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.HashSet;
import java.util.regex.Pattern;

/**
 * Android binding for Leopard Speech-to-Text engine.
 */
public class Leopard {

    private static String defaultModelPath;

    static {
        System.loadLibrary("pv_leopard");
    }

    private final long handle;

    /**
     * Constructor.
     *
     * @param accessKey AccessKey obtained from Picovoice Console
     * @param modelPath Absolute path to the file containing Leopard model parameters.
     * @throws LeopardException if there is an error while initializing Leopard.
     */
    public Leopard(String accessKey, String modelPath) throws LeopardException {
        handle = init(accessKey, modelPath);
    }

    private static String extractResource(Context context, InputStream srcFileStream, String dstFilename) throws IOException {
        InputStream is = new BufferedInputStream(srcFileStream, 256);
        OutputStream os = new BufferedOutputStream(context.openFileOutput(dstFilename, Context.MODE_PRIVATE), 256);
        int r;
        while ((r = is.read()) != -1) {
            os.write(r);
        }
        os.flush();

        is.close();
        os.close();
        return new File(context.getFilesDir(), dstFilename).getAbsolutePath();
    }

    /**
     * Releases resources acquired by Leopard.
     */
    public void delete() {
        delete(handle);
    }

    /**
     * Processes given audio data and returns its transcription.
     *
     * @param pcm A frame of audio samples. The number of samples per frame can be attained by
     *            calling {@link #getFrameLength()}. The incoming audio needs to have a sample rate
     *            equal to {@link #getSampleRate()} and be 16-bit linearly-encoded. Furthermore,
     *            Leopard operates on single channel audio. If you wish to process data in a different
     *            sample rate or format consider using `.process_file`.
     * @return Inferred transcription.
     * @throws LeopardException if there is an error while processing the audio frame.
     */
    public String process(short[] pcm) throws LeopardException {
        return process(handle, pcm, pcm.length);
    }

    /**
     * Processes given audio data and returns its transcription.
     *
     * @param pcm Absolute path to the audio file. The file needs to have a sample rate equal to or greater
     *                than {@link #getSampleRate()}. The supported formats are: `FLAC`, `MP3`, `Ogg`, `Opus`,
     *                `Vorbis`, `WAV`, and `WebM`.
     * @return Inferred transcription.
     * @throws LeopardException if there is an error while processing the audio frame.
     */
    public String processFile(String path) throws LeopardException {
        return processFile(handle, path);
    }

    /**
     * Getter for required audio sample rate for PCM data.
     *
     * @return Required audio sample rate for PCM data.
     */
    public native int getSampleRate();

    /**
     * Getter for Leopard version.
     *
     * @return Leopard version.
     */
    public native String getVersion();

    private native long init(String accessKey, String modelPath);

    private native void delete(long object);

    private native String process(long object, short[] pcm, int numSamples);

    private native String processFile(long object, String path);

    public static class Builder {

        private String accessKey = null;
        private String modelPath = null;

        public Builder(String accessKey) {
            this.accessKey = accessKey;
        }

        public Builder setAccessKey(String accessKey) {
            this.accessKey = accessKey;
            return this;
        }

        public Builder setModelPath(String modelPath) {
            this.modelPath = modelPath;
            return this;
        }

        public Leopard build(Context context) throws LeopardException {

            if (modelPath == null) {
                throw new LeopardInvalidArgumentException("ModelPath must not be null");
            } else {
                File modelFile = new File(modelPath);
                String modelFilename = modelFile.getName();
                if (!modelFile.exists() && !modelFilename.equals("")) {
                    try {
                        modelPath = extractResource(context,
                                context.getAssets().open(modelPath),
                                modelFilename);
                    } catch (IOException ex) {
                        throw new LeopardIOException(ex);
                    }
                }
            }

            if (accessKey == null) {
                throw new LeopardInvalidArgumentException("AccessKey must not be null");
            }

            return new Leopard(accessKey, modelPath);
        }
    }
}
