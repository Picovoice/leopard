/*
    Copyright 2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
*/

using System;
using System.Collections.Generic;
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
    /// Class for storing word metadata
    /// </summary>
    public class LeopardWord
    {
        public LeopardWord(string word, float confidence, float startSec, float endSec)
        {
            Word = word;
            Confidence = confidence;
            StartSec = startSec;
            EndSec = endSec;
        }

        public string Word { get; }
        public float Confidence { get; }
        public float StartSec { get; }
        public float EndSec { get; }
    }

    /// <summary>
    /// Class that contains transcription results
    /// </summary>
    public class LeopardTranscript
    {
        public LeopardTranscript(string transcriptString, LeopardWord[] wordArray)
        {
            TranscriptString = transcriptString;
            WordArray = wordArray;
        }

        public string TranscriptString { get; }

        public LeopardWord[] WordArray { get; }

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
#if NETCOREAPP3_1_OR_GREATER
            NativeLibrary.SetDllImportResolver(typeof(Leopard).Assembly, ImportResolver);
#endif
            DEFAULT_MODEL_PATH = Utils.PvModelPath();
        }

#if NETCOREAPP3_1_OR_GREATER
        private static IntPtr ImportResolver(string libraryName, Assembly assembly, DllImportSearchPath? searchPath)
        {
            IntPtr libHandle = IntPtr.Zero;
            NativeLibrary.TryLoad(Utils.PvLibraryPath(libraryName), out libHandle);
            return libHandle;
        }
#endif
        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl)]
        private static extern PvStatus pv_leopard_init(
            IntPtr accessKey,
            IntPtr modelPath,
            bool enable_automatic_punctuation,
            out IntPtr handle);

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl)]
        private static extern Int32 pv_sample_rate();

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl)]
        private static extern void pv_leopard_delete(IntPtr handle);

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl)]
        private static extern PvStatus pv_leopard_process(
            IntPtr handle,
            Int16[] pcm,
            Int32 pcmLength,
            out IntPtr transcriptPtr,
            out Int32 numWords,
            out IntPtr wordsPtr);

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl)]
        private static extern PvStatus pv_leopard_process_file(
            IntPtr handle,
            IntPtr audioPath,
            out IntPtr transcriptPtr,
            out Int32 numWords,
            out IntPtr wordsPtr);

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl)]
        private static extern IntPtr pv_leopard_version();

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl)]
        private static extern void pv_free(IntPtr memoryPtr);

        /// <summary>
        /// C Struct for storing word metadata
        /// </summary>
        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
        private struct CWord
        {
            public IntPtr wordPtr;
            public float startSec;
            public float endSec;
            public float confidence;
        }

        /// <summary>
        /// Factory method for Leopard Speech-to-Text engine.
        /// </summary>
        /// <param name="accessKey">AccessKey obtained from Picovoice Console (https://console.picovoice.ai/).</param>
        /// <param name="modelPath">
        /// Absolute path to the file containing model parameters. If not set it will be set to the
        /// default location.
        /// </param>
        /// <param name="enableAutomaticPunctuation">
        /// Set to `true` to enable automatic punctuation insertion.
        /// </param>
        /// <returns>An instance of Leopard Speech-to-Text engine.</returns>
        public static Leopard Create(string accessKey, string modelPath = null, bool enableAutomaticPunctuation = false)
        {
            return new Leopard(accessKey, modelPath ?? DEFAULT_MODEL_PATH, enableAutomaticPunctuation);
        }

        /// <summary>
        /// Creates an instance of the Leopard Speech-to-Text engine.
        /// </summary>
        /// <param name="accessKey">AccessKey obtained from Picovoice Console (https://console.picovoice.ai/).</param>
        /// <param name="modelPath">
        /// Absolute path to the file containing model parameters. If not set it will be set to the
        /// default location.
        /// </param>
        /// <param name="enableAutomaticPunctuation">
        /// Set to `true` to enable automatic punctuation insertion.
        /// </param>
        private Leopard(
            string accessKey,
            string modelPath,
            bool enableAutomaticPunctuation)
        {
            if (string.IsNullOrEmpty(accessKey))
            {
                throw new LeopardInvalidArgumentException("No AccessKey provided to Leopard");
            }

            if (!File.Exists(modelPath))
            {
                throw new LeopardIOException($"Couldn't find model file at '{modelPath}'");
            }

            IntPtr accessKeyPtr = Utils.GetPtrFromUtf8String(accessKey);
            IntPtr modelPathPtr = Utils.GetPtrFromUtf8String(modelPath);

            PvStatus status = pv_leopard_init(
                accessKeyPtr,
                modelPathPtr,
                enableAutomaticPunctuation,
                out _libraryPointer);

            Marshal.FreeHGlobal(accessKeyPtr);
            Marshal.FreeHGlobal(modelPathPtr);

            if (status != PvStatus.SUCCESS)
            {
                throw PvStatusToException(status);
            }

            Version = Utils.GetUtf8StringFromPtr(pv_leopard_version());
            SampleRate = pv_sample_rate();
        }

        /// <summary>
        /// Processes a given audio data and returns its transcription.
        /// </summary>
        /// <param name="pcm">
        /// Audio data. The audio needs to have a sample rate equal to `.SampleRate` and be 16-bit linearly-encoded. This function operates on single-channel audio.
        /// </param>
        /// <returns>
        /// LeopardTranscript object which contains the transcription results of the engine.
        /// </returns>
        public LeopardTranscript Process(Int16[] pcm)
        {
            if (pcm.Length == 0 | pcm == null)
            {
                throw new LeopardInvalidArgumentException("Input audio frame is empty");
            }

            IntPtr transcriptPtr = IntPtr.Zero;
            Int32 numWords = 0;
            IntPtr wordsPtr = IntPtr.Zero;
            PvStatus status = pv_leopard_process
                (_libraryPointer, 
                pcm,
                (Int32)pcm.Length, 
                out transcriptPtr,
                out numWords,
                out wordsPtr);
            if (status != PvStatus.SUCCESS)
            {
                throw PvStatusToException(status, "Leopard failed to process the audio frame.");
            }

            string transcript = Utils.GetUtf8StringFromPtr(transcriptPtr);
            pv_free(transcriptPtr);
            List<LeopardWord> wordsList = new List<LeopardWord>();
            for (int i = 0; i < numWords; i++)
            {
                CWord cword = (CWord)Marshal.PtrToStructure(wordsPtr, typeof(CWord));
                string word = Utils.GetUtf8StringFromPtr(cword.wordPtr);
                pv_free(cword.wordPtr);
                wordsList.Add(new LeopardWord(word, cword.confidence, cword.startSec, cword.endSec));
                wordsPtr += Marshal.SizeOf(typeof(CWord));
            }
            return new LeopardTranscript(transcript, wordsList.ToArray());
        }

        /// <summary>
        /// Processes a given audio file and returns its transcription.
        /// </summary>
        /// <param name="audioPath">
        /// Absolute path to the audio file. The file needs to have a sample rate equal to or greater than `SampleRate`.
        /// The supported formats are: `FLAC`, `MP3`, `Ogg`, `Opus`, `Vorbis`, `WAV`, and `WebM`.
        /// </param>
        /// <returns>
        /// LeopardTranscript object which contains the transcription results of the engine.
        /// </returns>
        public LeopardTranscript ProcessFile(string audioPath)
        {
            if (!File.Exists(audioPath))
            {
                throw new LeopardIOException($"Couldn't find audio file at '{audioPath}'");
            }

            IntPtr audioPathPtr = Utils.GetPtrFromUtf8String(audioPath);

            IntPtr transcriptPtr = IntPtr.Zero;
            Int32 numWords = 0;
            IntPtr wordsPtr = IntPtr.Zero;
            PvStatus status = pv_leopard_process_file(
                _libraryPointer, 
                audioPathPtr,
                out transcriptPtr,
                out numWords,
                out wordsPtr);

            Marshal.FreeHGlobal(audioPathPtr);

            if (status != PvStatus.SUCCESS)
            {
                throw PvStatusToException(status, "Leopard failed to process the audio file.");
            }

            string transcript = Utils.GetUtf8StringFromPtr(transcriptPtr);
            pv_free(transcriptPtr);
            List<LeopardWord> wordsList = new List<LeopardWord>();
            for (int i = 0; i < numWords; i++)
            {
                CWord cword = (CWord)Marshal.PtrToStructure(wordsPtr, typeof(CWord));
                string word = Utils.GetUtf8StringFromPtr(cword.wordPtr);
                wordsList.Add(new LeopardWord(word, cword.confidence, cword.startSec, cword.endSec));
                wordsPtr += Marshal.SizeOf(typeof(CWord));
            }
            return new LeopardTranscript(transcript, wordsList.ToArray());
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
