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

import java.io.File;
import java.util.Arrays;

public class Leopard {

    public static final String LIBRARY_PATH;
    public static final String MODEL_PATH;
    public static final String[] VALID_EXTENSIONS;

    static {
        LIBRARY_PATH = Utils.getPackagedLibraryPath();
        MODEL_PATH = Utils.getPackagedModelPath();
        VALID_EXTENSIONS = Utils.getValidFileExtensions();
    }

    private long handle;

    /**
     * Constructor.
     *
     * @param accessKey                  AccessKey obtained from Picovoice Console
     * @param modelPath                  Absolute path to the file containing Leopard model parameters.
     * @param libraryPath                Absolute path to the native Leopard library.
     * @param enableAutomaticPunctuation Set to `true` to enable automatic punctuation insertion.
     * @throws LeopardException if there is an error while initializing Leopard.
     */
    private Leopard(String accessKey, String modelPath, String libraryPath, boolean enableAutomaticPunctuation) throws LeopardException {
        try {
            System.load(libraryPath);
        } catch (Exception exception) {
            throw new LeopardException(exception);
        }
        handle = LeopardNative.init(accessKey, modelPath, enableAutomaticPunctuation);
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
     *            Leopard operates on single channel audio only.
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
     * Processes given audio file and returns its transcription.
     *
     * @param path Absolute path to the audio file. The supported formats are:
     *             `3gp (AMR)`, `FLAC`, `MP3`, `MP4/m4a (AAC)`, `Ogg`, `WAV`, `WebM`
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
            if (path.contains(".")) {
                String extension = path.substring(path.lastIndexOf(".") + 1);
                if (!Arrays.asList(VALID_EXTENSIONS).contains(extension)) {
                    throw new LeopardInvalidArgumentException(String.format("Specified file with extension '%s' is not supported", extension));
                }
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

    public static class Builder {
        private String accessKey = null;
        private String libraryPath = null;
        private String modelPath = null;

        private boolean enableAutomaticPunctuation = false;

        /**
         * Setter the AccessKey
         *
         * @param accessKey AccessKey obtained from Picovoice Console
         */
        public Builder setAccessKey(String accessKey) {
            this.accessKey = accessKey;
            return this;
        }

        /**
         * Setter for the absolute path to the file containing Leopard library.
         *
         * @param libraryPath Absolute path to the Leopard library.
         */
        public Builder setLibraryPath(String libraryPath) {
            this.libraryPath = libraryPath;
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
         * Setter for enabling automatic punctuation insertion
         *
         * @param enableAutomaticPunctuation Set to `true` to enable automatic punctuation insertion.
         */
        public Builder setEnableAutomaticPunctuation(boolean enableAutomaticPunctuation) {
            this.enableAutomaticPunctuation = enableAutomaticPunctuation;
            return this;
        }

        public Leopard build() throws LeopardException {

            if (!Utils.isEnvironmentSupported()) {
                throw new LeopardRuntimeException("Could not initialize Leopard. " + "Execution environment not currently supported by Leopard Java.");
            }

            if (accessKey == null) {
                throw new LeopardInvalidArgumentException("AccessKey must not be null");
            }

            if (libraryPath == null) {
                if (Utils.isResourcesAvailable()) {
                    libraryPath = LIBRARY_PATH;
                } else {
                    throw new LeopardInvalidArgumentException("Default library unavailable. Please " + "provide a native Leopard library path (-l <library_path>).");
                }
                if (libraryPath == null || !new File(libraryPath).exists()) {
                    throw new LeopardIOException(String.format("Couldn't find library file at " + "'%s'", libraryPath));
                }
            }

            if (modelPath == null) {
                if (Utils.isResourcesAvailable()) {
                    modelPath = MODEL_PATH;
                } else {
                    throw new LeopardInvalidArgumentException("Default model unavailable. Please provide a " + "valid Leopard model path (-m <model_path>).");
                }
                if (!new File(modelPath).exists()) {
                    throw new LeopardIOException(String.format("Couldn't find model file at " + "'%s'", modelPath));
                }
            }

            return new Leopard(accessKey, modelPath, libraryPath, enableAutomaticPunctuation);
        }
    }
}
