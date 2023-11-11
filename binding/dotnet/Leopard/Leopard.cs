/*
    Copyright 2022-2023 Picovoice Inc.

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

        public static readonly string DEFAULT_MODEL_PATH;
        private IntPtr _libraryPointer;

        static Leopard()
        {

#if NETCOREAPP3_0_OR_GREATER

            NativeLibrary.SetDllImportResolver(typeof(Leopard).Assembly, ImportResolver);

#endif

            DEFAULT_MODEL_PATH = Utils.PvModelPath();
        }

#if NETCOREAPP3_0_OR_GREATER

        private static IntPtr ImportResolver(string libraryName, Assembly assembly, DllImportSearchPath? searchPath)
        {
            IntPtr libHandle;
            NativeLibrary.TryLoad(Utils.PvLibraryPath(libraryName), out libHandle);
            return libHandle;
        }

#endif

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl)]
        private static extern PvStatus pv_leopard_init(
            IntPtr accessKey,
            IntPtr modelPath,
            bool enableAutomaticPunctuation,
            bool enableDiarization,
            out IntPtr handle);

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl)]
        private static extern void pv_leopard_delete(IntPtr handle);

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl)]
        private static extern void pv_leopard_transcript_delete(IntPtr transcript);

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl)]
        private static extern void pv_leopard_words_delete(IntPtr words);

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
        private static extern Int32 pv_sample_rate();

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl)]
        private static extern void pv_set_sdk(string sdk);

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl)]
        private static extern PvStatus pv_get_error_stack(out IntPtr messageStack, out int messageStackDepth);

        [DllImport(LIBRARY, CallingConvention = CallingConvention.Cdecl)]
        private static extern void pv_free_error_stack(IntPtr messageStack);

        /// <summary>
        /// C Struct for storing word metadata
        /// </summary>
        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
        private struct CWord
        {
            public readonly IntPtr wordPtr;
            public readonly float startSec;
            public readonly float endSec;
            public readonly float confidence;
            public readonly Int32 speakerTag;
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
        /// <param name="enableDiarization">
        /// Set to `true` to enable speaker diarization, which allows Leopard to differentiate speakers as
        /// part of the transcription process. Word metadata will include a `SpeakerTag` to identify unique speakers.
        /// </param>
        /// <returns>An instance of Leopard Speech-to-Text engine.</returns>
        public static Leopard Create(
            string accessKey,
            string modelPath = null,
            bool enableAutomaticPunctuation = false,
            bool enableDiarization = false)
        {
            return new Leopard(
                accessKey,
                modelPath ?? DEFAULT_MODEL_PATH,
                enableAutomaticPunctuation,
                enableDiarization);
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
        /// <param name="enableDiarization">
        /// Set to `true` to enable speaker diarization, which allows Leopard to differentiate speakers as
        /// part of the transcription process. Word metadata will include a `SpeakerTag` to identify unique speakers.
        /// </param>
        private Leopard(
            string accessKey,
            string modelPath,
            bool enableAutomaticPunctuation,
            bool enableDiarization)
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

            pv_set_sdk("dotnet");

            PvStatus status = pv_leopard_init(
                accessKeyPtr,
                modelPathPtr,
                enableAutomaticPunctuation,
                enableDiarization,
                out _libraryPointer);

            Marshal.FreeHGlobal(accessKeyPtr);
            Marshal.FreeHGlobal(modelPathPtr);

            if (status != PvStatus.SUCCESS)
            {
                string[] messageStack = GetMessageStack();
                throw PvStatusToException(status, "Leopard init failed", messageStack);
            }

            Version = Utils.GetUtf8StringFromPtr(pv_leopard_version());
            SampleRate = pv_sample_rate();
        }

        /// <summary>
        /// Processes a given audio data and returns its transcription.
        /// </summary>
        /// <param name="pcm">
        /// Audio data. The audio needs to have a sample rate equal to `.SampleRate` and be 16-bit linearly-encoded. This
        /// function operates on single-channel audio.
        /// </param>
        /// <returns>
        /// LeopardTranscript object which contains the transcription results of the engine.
        /// </returns>
        public LeopardTranscript Process(Int16[] pcm)
        {
            if (pcm == null || pcm.Length == 0)
            {
                throw new LeopardInvalidArgumentException("Input audio frame is empty");
            }

            IntPtr transcriptPtr;
            Int32 numWords;
            IntPtr wordsPtr;
            PvStatus status = pv_leopard_process
            (_libraryPointer,
                pcm,
                pcm.Length,
                out transcriptPtr,
                out numWords,
                out wordsPtr);
            if (status != PvStatus.SUCCESS)
            {
                string[] messageStack = GetMessageStack();
                throw PvStatusToException(status, "Leopard process failed", messageStack);
            }

            string transcript = Utils.GetUtf8StringFromPtr(transcriptPtr);
            pv_leopard_transcript_delete(transcriptPtr);

            LeopardWord[] wordsList = new LeopardWord[numWords];
            IntPtr orgWordsPtr = wordsPtr;
            for (int i = 0; i < numWords; i++)
            {
                CWord cword = (CWord)Marshal.PtrToStructure(wordsPtr, typeof(CWord));
                wordsList[i] = new LeopardWord(
                    Utils.GetUtf8StringFromPtr(cword.wordPtr),
                    cword.confidence,
                    cword.startSec,
                    cword.endSec,
                    cword.speakerTag);
                wordsPtr += Marshal.SizeOf(typeof(CWord));
            }

            pv_leopard_words_delete(orgWordsPtr);
            return new LeopardTranscript(transcript, wordsList);
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
            if (String.IsNullOrEmpty(audioPath))
            {
                throw new LeopardInvalidArgumentException("Audio file path was empty");
            }

            if (!File.Exists(audioPath))
            {
                throw new LeopardIOException($"Couldn't find audio file at '{audioPath}'");
            }

            IntPtr audioPathPtr = Utils.GetPtrFromUtf8String(audioPath);

            IntPtr transcriptPtr;
            Int32 numWords;
            IntPtr wordsPtr;
            PvStatus status = pv_leopard_process_file(
                _libraryPointer,
                audioPathPtr,
                out transcriptPtr,
                out numWords,
                out wordsPtr);

            Marshal.FreeHGlobal(audioPathPtr);

            if (status != PvStatus.SUCCESS)
            {
                string[] messageStack = GetMessageStack();
                throw PvStatusToException(status, "Leopard process file failed", messageStack);
            }

            string transcript = Utils.GetUtf8StringFromPtr(transcriptPtr);
            pv_leopard_transcript_delete(transcriptPtr);

            LeopardWord[] wordsList = new LeopardWord[numWords];
            IntPtr orgWordsPtr = wordsPtr;
            for (int i = 0; i < numWords; i++)
            {
                CWord cword = (CWord)Marshal.PtrToStructure(wordsPtr, typeof(CWord));
                wordsList[i] = new LeopardWord(
                    Utils.GetUtf8StringFromPtr(cword.wordPtr),
                    cword.confidence,
                    cword.startSec,
                    cword.endSec,
                    cword.speakerTag);
                wordsPtr += Marshal.SizeOf(typeof(CWord));
            }

            pv_leopard_words_delete(orgWordsPtr);
            return new LeopardTranscript(transcript, wordsList);
        }

        /// <summary>
        /// Gets the version number of the Leopard library.
        /// </summary>
        /// <returns>Version of Leopard</returns>
        public string Version { get; }

        /// <summary>
        /// Get the audio sample rate required by Leopard
        /// </summary>
        /// <returns>Required sample rate.</returns>
        public Int32 SampleRate { get; }

        /// <summary>
        /// Coverts status codes to relevant .NET exceptions
        /// </summary>
        /// <param name="status">Picovoice library status code.</param>
        /// <param name="message">Default error message.</param>
        /// <param name="messageStack">Error stack returned from Picovoice library.</param>
        /// <returns>.NET exception</returns>
        private static Exception PvStatusToException(
            PvStatus status,
            string message = "",
            string[] messageStack = null)
        {
            if (messageStack == null)
            {
                messageStack = new string[] { };
            }

            switch (status)
            {
                case PvStatus.OUT_OF_MEMORY:
                    return new LeopardMemoryException(message, messageStack);
                case PvStatus.IO_ERROR:
                    return new LeopardIOException(message, messageStack);
                case PvStatus.INVALID_ARGUMENT:
                    return new LeopardInvalidArgumentException(message, messageStack);
                case PvStatus.STOP_ITERATION:
                    return new LeopardStopIterationException(message, messageStack);
                case PvStatus.KEY_ERROR:
                    return new LeopardKeyException(message, messageStack);
                case PvStatus.INVALID_STATE:
                    return new LeopardInvalidStateException(message, messageStack);
                case PvStatus.RUNTIME_ERROR:
                    return new LeopardRuntimeException(message, messageStack);
                case PvStatus.ACTIVATION_ERROR:
                    return new LeopardActivationException(message, messageStack);
                case PvStatus.ACTIVATION_LIMIT_REACHED:
                    return new LeopardActivationLimitException(message, messageStack);
                case PvStatus.ACTIVATION_THROTTLED:
                    return new LeopardActivationThrottledException(message, messageStack);
                case PvStatus.ACTIVATION_REFUSED:
                    return new LeopardActivationRefusedException(message, messageStack);
                default:
                    return new LeopardException("Unmapped error code returned from Leopard.", messageStack);
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

        private string[] GetMessageStack()
        {
            Int32 messageStackDepth;
            IntPtr messageStackRef;

            PvStatus status = pv_get_error_stack(out messageStackRef, out messageStackDepth);
            if (status != PvStatus.SUCCESS)
            {
                throw PvStatusToException(status, "Unable to get Leopard error state");
            }

            int elementSize = Marshal.SizeOf(typeof(IntPtr));
            string[] messageStack = new string[messageStackDepth];

            for (int i = 0; i < messageStackDepth; i++)
            {
                messageStack[i] = Marshal.PtrToStringAnsi(Marshal.ReadIntPtr(messageStackRef, i * elementSize));
            }

            pv_free_error_stack(messageStackRef);

            return messageStack;
        }
    }
}