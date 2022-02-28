/*
    Copyright 2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
*/

using System;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;

namespace Pv
{
    /// <summary>
    /// Status codes returned by Leopard library
    /// </summary>
    public enum PvStatus
    {
        SUCCESS = 0,
        OUT_OF_MEMORY = 1,
        IO_ERROR = 2,
        INVALID_ARGUMENT = 3,
        STOP_ITERATION = 4,
        KEY_ERROR = 5,
        INVALID_STATE = 6,
        RUNTIME_ERROR = 7,
        ACTIVATION_ERROR = 8,
        ACTIVATION_LIMIT_REACHED = 9,
        ACTIVATION_THROTTLED = 10,
        ACTIVATION_REFUSED = 11
    }

    /// <summary>
    /// .NET binding for Leopard Speech-to-Text Engine.
    /// </summary>
    public class Leopard : IDisposable
    {
        private const string LIBRARY = "libpv_leopard";
        private IntPtr _libraryPointer = IntPtr.Zero;

        public static readonly string DEFAULT_MODEL_PATH;

        static Leopard()
        {
#if NETCOREAPP3_1
            NativeLibrary.SetDllImportResolver(typeof(Leopard).Assembly, ImportResolver);
#endif
            DEFAULT_MODEL_PATH = Utils.PvModelPath();
        }

#if NETCOREAPP3_1
        private static IntPtr ImportResolver(string libraryName, Assembly assembly, DllImportSearchPath? searchPath)
        {
            IntPtr libHandle = IntPtr.Zero;
            NativeLibrary.TryLoad(Utils.PvLibraryPath(libraryName), out libHandle);
            return libHandle;
        }
#endif
        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
        private static extern PvStatus pv_leopard_init(
            string accessKey,
            string modelPath,
            out IntPtr handle);

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
        private static extern Int32 pv_sample_rate();

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
        private static extern void pv_leopard_delete(IntPtr handle);

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
        private static extern PvStatus pv_leopard_process(
            IntPtr handle,
            Int16[] pcm,
            Int32 pcmLength,
            out IntPtr transcriptPtr);

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
        private static extern PvStatus pv_leopard_process_file(
            IntPtr handle,
            string audioPath,
            out IntPtr transcriptPtr);

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
        private static extern IntPtr pv_leopard_version();

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
        private static extern void pv_free(IntPtr memoryPtr);

        /// <summary>
        /// Factory method for Leopard Speech-to-Text engine.
        /// </summary>
        /// <param name="accessKey">AccessKey obtained from Picovoice Console (https://console.picovoice.ai/).</param>
        /// <param name="modelPath">
        /// Absolute path to the file containing model parameters. If not set it will be set to the 
        /// default location.
        /// </param>
        /// <returns>An instance of Leopard Speech-to-Text engine.</returns>                             
        public static Leopard Create(string accessKey, string modelPath = null)
        {
            return new Leopard(accessKey, modelPath ?? DEFAULT_MODEL_PATH);
        }

        /// <summary>
        /// Creates an instance of the Leopard Speech-to-Text engine.
        /// </summary>
        /// <param name="accessKey">AccessKey obtained from Picovoice Console (https://console.picovoice.ai/).</param>
        /// <param name="modelPath">
        /// Absolute path to the file containing model parameters. If not set it will be set to the 
        /// default location.
        /// </param>       
        private Leopard(
            string accessKey,
            string modelPath)
        {
            if (string.IsNullOrEmpty(accessKey))
            {
                throw new LeopardInvalidArgumentException("No AccessKey provided to Leopard");
            }

            if (!File.Exists(modelPath))
            {
                throw new LeopardIOException($"Couldn't find model file at '{modelPath}'");
            }

            PvStatus status = pv_leopard_init(
                accessKey,
                modelPath,
                out _libraryPointer);
            if (status != PvStatus.SUCCESS)
            {
                throw PvStatusToException(status);
            }

            Version = Marshal.PtrToStringAnsi(pv_leopard_version());
            SampleRate = pv_sample_rate();
        }

        /// <summary>
        /// Processes a given audio data and returns its transcription.
        /// </summary>
        /// <param name="pcm">
        /// Audio data. The audio needs to have a sample rate equal to `.SampleRate` and be 16-bit linearly-encoded. This function operates on single-channel audio.
        /// </param>
        /// <returns>
        /// Inferred transcription.
        /// </returns>
        public string Process(Int16[] pcm)
        {
            if (pcm.Length == 0 | pcm == null)
            {
                throw new LeopardInvalidArgumentException("Input audio frame is empty");
            }

            IntPtr transcriptPtr = IntPtr.Zero;
            PvStatus status = pv_leopard_process(_libraryPointer, pcm, (Int32) pcm.Length, out transcriptPtr);
            if (status != PvStatus.SUCCESS)
            {
                throw PvStatusToException(status, "Leopard failed to process the audio frame.");
            }

            string transcript = Marshal.PtrToStringAnsi(transcriptPtr);
            pv_free(transcriptPtr);
            return transcript;
        }

        /// <summary>
        /// Processes a given audio file and returns its transcription.
        /// </summary>
        /// <param name="audioPath">
        /// Absolute path to the audio file. The file needs to have a sample rate equal to or greater than `SampleRate`.
        /// The supported formats are: `FLAC`, `MP3`, `Ogg`, `Opus`, `Vorbis`, `WAV`, and `WebM`.
        /// </param>
        /// <returns>
        /// Inferred transcription.
        /// </returns>
        public string ProcessFile(string audioPath)
        {
            if (!File.Exists(audioPath))
            {
                throw new LeopardIOException($"Couldn't find audio file at '{audioPath}'");
            }

            IntPtr transcriptPtr = IntPtr.Zero;
            PvStatus status = pv_leopard_process_file(_libraryPointer, audioPath, out transcriptPtr);
            if (status != PvStatus.SUCCESS)
            {
                throw PvStatusToException(status, "Leopard failed to process the audio file.");
            }

            string transcript = Marshal.PtrToStringAnsi(transcriptPtr);
            pv_free(transcriptPtr);
            return transcript;
        }

        /// <summary>
        /// Gets the version number of the Leopard library.
        /// </summary>
        /// <returns>Version of Leopard</returns>
        public string Version { get; private set; }

        /// <summary>
        /// Get the audio sample rate required by Leopard
        /// </summary>
        /// <returns>Required sample rate.</returns>
        public Int32 SampleRate { get; private set; }

        /// <summary>
        /// Coverts status codes to relavent .NET exceptions
        /// </summary>
        /// <param name="status">Picovoice library status code.</param>
        /// <returns>.NET exception</returns>
        private static Exception PvStatusToException(PvStatus status, string message = "")
        {
            switch (status)
            {
                case PvStatus.OUT_OF_MEMORY:
                    return new LeopardMemoryException(message);
                case PvStatus.IO_ERROR:
                    return new LeopardIOException(message);
                case PvStatus.INVALID_ARGUMENT:
                    return new LeopardInvalidArgumentException(message);
                case PvStatus.STOP_ITERATION:
                    return new LeopardStopIterationException(message);
                case PvStatus.KEY_ERROR:
                    return new LeopardKeyException(message);
                case PvStatus.INVALID_STATE:
                    return new LeopardInvalidStateException(message);
                case PvStatus.RUNTIME_ERROR:
                    return new LeopardRuntimeException(message);
                case PvStatus.ACTIVATION_ERROR:
                    return new LeopardActivationException(message);
                case PvStatus.ACTIVATION_LIMIT_REACHED:
                    return new LeopardActivationLimitException(message);
                case PvStatus.ACTIVATION_THROTTLED:
                    return new LeopardActivationThrottledException(message);
                case PvStatus.ACTIVATION_REFUSED:
                    return new LeopardActivationRefusedException(message);
                default:
                    return new LeopardException("Unmapped error code returned from Leopard.");
            }
        }

        /// <summary>
        /// Frees memory that was allocated for Leopard
        /// </summary>
        public void Dispose()
        {
            if (_libraryPointer != IntPtr.Zero)
            {
                pv_leopard_delete(_libraryPointer);
                _libraryPointer = IntPtr.Zero;

                // ensures finalizer doesn't trigger if already manually disposed
                GC.SuppressFinalize(this);
            }
        }

        ~Leopard()
        {
            Dispose();
        }
    }
}
