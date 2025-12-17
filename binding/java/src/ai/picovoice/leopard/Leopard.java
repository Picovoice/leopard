/*
    Copyright 2022-2025 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is
    located in the "LICENSE" file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the
    License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
    express or implied. See the License for the specific language governing permissions and
    limitations under the License.
*/

package ai.picovoice.leopard;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * Class for the Leopard Speech-to-Text engine.
 */
public class Leopard {

    public static final String LIBRARY_PATH;
    public static final String MODEL_PATH;
    public static final List<String> VALID_EXTENSIONS;

    private static String sdk = "java";

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
     * @param device                     String representation of the device (e.g., CPU or GPU) to use. If set
     *                                   to `best`, the most suitable device is selected automatically. If set
     *                                   to `gpu`, the engine uses the first available GPU device. To select
     *                                   a specific GPU device, set this argument to `gpu:${GPU_INDEX}`, where
     *                                   `${GPU_INDEX}` is the index of the target GPU. If set to `cpu`, the engine
     *                                   will run on the CPU with the default number of threads. To specify the number
     *                                   of threads, set this argument to `cpu:${NUM_THREADS}`, where `${NUM_THREADS}`
     *                                   is the desired number of threads.
     * @param libraryPath                Absolute path to the native Leopard library.
     * @param enableAutomaticPunctuation Set to `true` to enable automatic punctuation insertion.
     * @param enableDiarization          Set to `true` to enable speaker diarization, which allows Leopard to
     *                                   differentiate speakers as part of the transcription process. Word metadata
     *                                   will include a `speakerTag` to identify unique speakers.
     * @throws LeopardException if there is an error while initializing Leopard.
     */
    private Leopard(
            String accessKey,
            String modelPath,
            String device,
            String libraryPath,
            boolean enableAutomaticPunctuation,
            boolean enableDiarization) throws LeopardException {
        try {
            ArrayList<String> libraryDependencies = Utils.getLibraryDependencyPaths(libraryPath);
            for (String dependency : libraryDependencies) {
                System.load(dependency);
            }
            System.load(libraryPath);
        } catch (Exception exception) {
            throw new LeopardException(exception);
        }

        LeopardNative.setSdk(Leopard.sdk);
        handle = LeopardNative.init(
                accessKey,
                modelPath,
                device,
                enableAutomaticPunctuation,
                enableDiarization);
    }

    public static void setSdk(String sdk) {
        Leopard.sdk = sdk;
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
                String extension = path.substring(path.lastIndexOf(".") + 1).toLowerCase();
                if (!VALID_EXTENSIONS.contains(extension)) {
                    throw new LeopardInvalidArgumentException(
                            String.format("Specified file with extension '%s' is not supported",
                                    extension));
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

    /**
     * Retrieves a list of available hardware devices that Leopard can use to run inference.
     *
     * @param libraryPath Path to a native Leopard library. Set to `null` to use default library.
     *
     * @return List of available hardware devices that Leopard can use to run inference.
     * @throws LeopardException if the library file cannot be loaded.
     */
    public static String[] getAvailableDevices(String libraryPath) throws LeopardException {
        try {
            System.load(libraryPath);
        } catch (Exception exception) {
            throw new LeopardException(exception);
        }
        return LeopardNative.listHardwareDevices();
    }

    /**
     * Retrieves a list of available hardware devices that Leopard can use to run inference.
     *
     * @return List of available hardware devices that Leopard can use to run inference.
     * @throws LeopardException if the default library file cannot be loaded.
     */
    public static String[] getAvailableDevices() throws LeopardException {
        if (Utils.isResourcesAvailable()) {
            return Leopard.getAvailableDevices(LIBRARY_PATH);
        } else {
            throw new LeopardInvalidArgumentException("Default library unavailable. " +
                    "Please provide a valid native Leopard library path.");
        }
    }

    /**
     * Builder for creating an instance of Leopard with a mixture of default arguments.
     */
    public static class Builder {
        private String accessKey = null;
        private String libraryPath = null;
        private String modelPath = null;
        private String device = null;
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
         * Setter for device.
         *
         * @param device String representation of the device
         */
        public Builder setDevice(String device) {
            this.device = device;
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
         *                          differentiate speakers as part of the transcription process. Word metadata
         *                          will include a `speakerTag` to identify unique speakers.
         */
        public Builder setEnableDiarization(boolean enableDiarization) {
            this.enableDiarization = enableDiarization;
            return this;
        }

        /**
         * Creates an instance of Leopard Speech-to-Text engine.
         */
        public Leopard build() throws LeopardException {

            if (!Utils.isEnvironmentSupported()) {
                throw new LeopardRuntimeException(
                        "Could not initialize Leopard. " +
                                "Execution environment not currently supported by Leopard Java.");
            }

            if (accessKey == null) {
                throw new LeopardInvalidArgumentException("AccessKey must not be null");
            }

            if (libraryPath == null) {
                if (Utils.isResourcesAvailable()) {
                    libraryPath = LIBRARY_PATH;
                } else {
                    throw new LeopardInvalidArgumentException(
                            "Default library unavailable. Please " +
                                    "provide a native Leopard library path (-l <library_path>).");
                }
                if (libraryPath == null || !new File(libraryPath).exists()) {
                    throw new LeopardIOException(
                            String.format(
                                    "Couldn't find library file at " + "'%s'", libraryPath));
                }
            }

            if (modelPath == null) {
                if (Utils.isResourcesAvailable()) {
                    modelPath = MODEL_PATH;
                } else {
                    throw new LeopardInvalidArgumentException(
                            "Default model unavailable. Please provide a " +
                                    "valid Leopard model path (-m <model_path>).");
                }
                if (!new File(modelPath).exists()) {
                    throw new LeopardIOException(String.format("Couldn't find model file at " + "'%s'", modelPath));
                }
            }

            if (device == null) {
                device = "best";
            }

            return new Leopard(
                    accessKey,
                    modelPath,
                    device,
                    libraryPath,
                    enableAutomaticPunctuation,
                    enableDiarization);
        }
    }
}
