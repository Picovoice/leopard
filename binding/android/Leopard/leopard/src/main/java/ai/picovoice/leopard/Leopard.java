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

import android.content.Context;
import android.text.TextUtils;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Android binding for Leopard Speech-to-Text engine.
 */
public class Leopard {

    private static final String[] VALID_EXTENSIONS = {
            "3gp",
            "flac",
            "m4a",
            "mp3",
            "mp4",
            "ogg",
            "opus",
            "vorbis",
            "wav",
            "webm"
    };

    static {
        System.loadLibrary("pv_leopard");
    }

    private long handle;
    private static String _sdk = "android";

    public static void setSdk(String sdk) {
        Leopard._sdk = sdk;
    }

    /**
     * Constructor.
     *
     * @param accessKey                  AccessKey obtained from Picovoice Console
     * @param modelPath                  Absolute path to the file containing Leopard model parameters.
     * @param enableAutomaticPunctuation Set to `true` to enable automatic punctuation insertion.
     * @param enableDiarization          Set to `true` to enable speaker diarization, which allows Leopard to
     *                                   differentiate speakers as part of the transcription process. Word
     *                                   metadata will include a `speaker_tag` to identify unique speakers.
     * @throws LeopardException if there is an error while initializing Leopard.
     */
    private Leopard(
            String accessKey,
            String modelPath,
            boolean enableAutomaticPunctuation,
            boolean enableDiarization) throws LeopardException {
        handle = LeopardNative.init(
                accessKey,
                modelPath,
                enableAutomaticPunctuation,
                enableDiarization);
    }

    private static String extractResource(
            Context context,
            InputStream srcFileStream,
            String dstFilename) throws IOException {
        InputStream is = new BufferedInputStream(
                srcFileStream,
                256);
        OutputStream os = new BufferedOutputStream(
                context.openFileOutput(dstFilename, Context.MODE_PRIVATE),
                256);
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
        if (handle != 0) {
            LeopardNative.delete(handle);
            handle = 0;
        }
    }

    /**
     * Processes given audio data and returns its transcription.
     *
     * @param pcm A frame of audio samples. The incoming audio needs to have a sample rate
     *            equal to {@link #getSampleRate()} and be 16-bit linearly-encoded. Furthermore,
     *            Leopard operates on single channel audio. If you wish to process data in a different
     *            sample rate or format consider using `.process_file`.
     * @return LeopardTranscript object which contains the transcription results of the engine.
     * @throws LeopardException if there is an error while processing the audio frame.
     */
    public LeopardTranscript process(short[] pcm) throws LeopardException {
        if (handle == 0) {
            throw new LeopardInvalidStateException("Attempted to call Leopard process after delete.");
        }

        if (pcm == null) {
            throw new LeopardInvalidArgumentException("Passed null frame to Leopard process.");
        }

        return LeopardNative.process(handle, pcm, pcm.length);
    }

    /**
     * Processes given audio data and returns its transcription.
     *
     * @param path Absolute path to the audio file. The supported formats are:
     *             `3gp (AMR)`, `FLAC`, `MP3`, `MP4/m4a (AAC)`, `Ogg`, `WAV` and `WebM`.
     * @return LeopardTranscript object which contains the transcription results of the engine.
     * @throws LeopardException if there is an error while processing the audio frame.
     */
    public LeopardTranscript processFile(String path) throws LeopardException {
        if (handle == 0) {
            throw new LeopardInvalidStateException("Attempted to call Leopard processFile after delete.");
        }

        if (path == null || path.equals("")) {
            throw new LeopardInvalidArgumentException("Passed null path to Leopard processFile.");
        }

        try {
            return LeopardNative.processFile(handle, path);
        } catch (LeopardInvalidArgumentException e) {
            boolean endsWithValidExt = false;
            for (String ext : VALID_EXTENSIONS) {
                if (path.endsWith(ext)) {
                    endsWithValidExt = true;
                    break;
                }
            }
            if (!endsWithValidExt) {
                throw new LeopardInvalidArgumentException(
                        String.format(
                                "Specified file '%s' does not have an accepted file extension. " +
                                        "Valid extensions are: %s",
                                path,
                                TextUtils.join(", ", VALID_EXTENSIONS)));
            }
            throw e;
        }
    }

    /**
     * Getter for required audio sample rate for PCM data.
     *
     * @return Required audio sample rate for PCM data.
     */
    public int getSampleRate() {
        return LeopardNative.getSampleRate();
    }

    /**
     * Getter for Leopard version.
     *
     * @return Leopard version.
     */
    public String getVersion() {
        return LeopardNative.getVersion();
    }

    /**
     * Builder for creating an instance of Leopard with a mixture of default arguments.
     */
    public static class Builder {

        private String accessKey = null;
        private String modelPath = null;
        private boolean enableAutomaticPunctuation = false;
        private boolean enableDiarization = false;

        /**
         * Setter the AccessKey.
         *
         * @param accessKey AccessKey obtained from Picovoice Console
         */
        public Builder setAccessKey(String accessKey) {
            this.accessKey = accessKey;
            return this;
        }

        /**
         * Setter for the absolute path to the file containing Leopard model parameters.
         *
         * @param modelPath Absolute path to the file containing Leopard model parameters.
         */
        public Builder setModelPath(String modelPath) {
            this.modelPath = modelPath;
            return this;
        }

        /**
         * Setter for enabling automatic punctuation insertion.
         *
         * @param enableAutomaticPunctuation Set to `true` to enable automatic punctuation insertion.
         */
        public Builder setEnableAutomaticPunctuation(boolean enableAutomaticPunctuation) {
            this.enableAutomaticPunctuation = enableAutomaticPunctuation;
            return this;
        }

        /**
         * Setter for enabling speaker diarization.
         *
         * @param enableDiarization Set to `true` to enable speaker diarization, which allows Leopard to
         *                          differentiate speakers as part of the transcription process. Word
         *                          metadata will include a `speaker_tag` to identify unique speakers.
         */
        public Builder setEnableDiarization(boolean enableDiarization) {
            this.enableDiarization = enableDiarization;
            return this;
        }

        /**
         * Creates an instance of Leopard Speech-to-Text engine.
         */
        public Leopard build(Context context) throws LeopardException {
            if (accessKey == null || this.accessKey.equals("")) {
                throw new LeopardInvalidArgumentException("No AccessKey was provided to Leopard");
            }

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

            return new Leopard(
                    accessKey,
                    modelPath,
                    enableAutomaticPunctuation,
                    enableDiarization);
        }
    }
}
