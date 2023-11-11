/*
    Copyright 2020-2023 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
*/

using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using Pv;

namespace LeopardDemo
{
    /// <summary>
    /// Microphone Demo for Leopard Speech-to-Text engine.
    /// It creates an input audio stream from a microphone and processes it with Leopard. 
    /// </summary>
    public class MicDemo
    {
        private static readonly int PV_RECORDER_FRAME_LENGTH = 2048;

        /// <summary>
        /// Creates an input audio stream and instantiates an instance of Leopard object.
        /// </summary>
        /// <param name="accessKey">
        /// AccessKey obtained from Picovoice Console (https://console.picovoice.ai/).
        /// </param>
        /// <param name="modelPath">
        /// Absolute path to the file containing model parameters.
        /// If not set it will be set to the default location.
        /// </param>           
        /// <param name="enableAutomaticPunctuation">
        /// Set to `true` to enable automatic punctuation insertion.
        /// </param>
        /// <param name="enableSpeakerDiarization">
        /// Set to `true` to enable speaker diarization, which allows Leopard to differentiate speakers as
        /// part of the transcription process. Word metadata will include a `SpeakerTag` to identify unique speakers.
        /// </param>
        /// <param name="verbose">Enable verbose logging.</param>
        /// <param name="audioDeviceIndex">
        /// Optional argument. If provided, audio is recorded from this input device.
        /// Otherwise, the default audio input device is used.
        /// </param>        
        private static void RunDemo(
            string accessKey,
            string modelPath,
            bool enableAutomaticPunctuation,
            bool enableSpeakerDiarization,
            bool verbose,
            int audioDeviceIndex)
        {
            using (Leopard leopard = Leopard.Create(
                accessKey: accessKey,
                modelPath: modelPath,
                enableAutomaticPunctuation: enableAutomaticPunctuation,
                enableSpeakerDiarization: enableSpeakerDiarization))
            {
                using (PvRecorder recorder = PvRecorder.Create(PV_RECORDER_FRAME_LENGTH, audioDeviceIndex))
                {
                    Console.WriteLine($"Using device: {recorder.SelectedDevice}");
                    Console.CancelKeyPress += delegate (object sender, ConsoleCancelEventArgs e)
                    {
                        Console.WriteLine("Stopping...");
                    };

                    List<short> audioFrames = new List<short>();
                    recorder.Start();
                    Console.WriteLine(">>> Press `CTRL+C` to exit:\n");

                    while (true)
                    {
                        Console.WriteLine(">>> Recording ... Press `ENTER` to stop:");
                        var tokenSource = new CancellationTokenSource();
                        CancellationToken token = tokenSource.Token;
                        Task recordingTask = Task.Run(() =>
                        {
                            audioFrames.Clear();
                            recorder.Start();
                            while (!token.IsCancellationRequested)
                            {
                                short[] frame = recorder.Read();
                                audioFrames.AddRange(frame);
                            }
                            recorder.Stop();
                        });

                        string s = Console.ReadLine();
                        if (s == null)
                        {
                            break;
                        }

                        tokenSource.Cancel();
                        recordingTask.Wait();

                        short[] pcm = audioFrames.ToArray();

                        Console.WriteLine(">>> Processing ... \n");
                        try
                        {
                            LeopardTranscript result = leopard.Process(pcm);
                            Console.WriteLine(result.TranscriptString);
                            if (verbose)
                            {
                                Console.WriteLine(
                                    string.Format(
                                        "\n|{0,-15}|{1,-10:0.00}|{2,-10:0.00}|{3,-10:0.00}|{4,-10}|\n",
                                        "Word",
                                        "Confidence",
                                        "StartSec",
                                        "EndSec",
                                        "SpeakerTag"));
                                for (int i = 0; i < result.WordArray.Length; i++)
                                {
                                    LeopardWord word = result.WordArray[i];
                                    Console.WriteLine(
                                        string.Format(
                                            "|{0,-15}|{1,10:0.00}|{2,10:0.00}|{3,10:0.00}|{4,10}|",
                                            word.Word,
                                            word.Confidence,
                                            word.StartSec,
                                            word.EndSec,
                                            word.SpeakerTag));
                                }
                                Console.WriteLine();
                            }
                        }
                        catch (LeopardActivationLimitException)
                        {
                            Console.WriteLine($"AccessKey '{accessKey}' has reached its processing limit.");
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Lists available audio input devices.
        /// </summary>
        private static void ShowAudioDevices()
        {
            string[] devices = PvRecorder.GetAvailableDevices();
            for (int i = 0; i < devices.Length; i++)
            {
                Console.WriteLine($"index: {i}, device name: {devices[i]}");
            }
        }

        public static void Main(string[] args)
        {
            AppDomain.CurrentDomain.UnhandledException += OnUnhandledException;
            if (args.Length == 0)
            {
                Console.WriteLine(HELP_STR);
                Console.Read();
                return;
            }

            string accessKey = null;
            string modelPath = null;
            bool enableAutomaticPunctuation = true;
            bool enableSpeakerDiarization = true;
            bool verbose = false;
            int audioDeviceIndex = -1;
            bool showAudioDevices = false;
            bool showHelp = false;

            // parse command line arguments
            int argIndex = 0;
            while (argIndex < args.Length)
            {
                if (args[argIndex] == "--access_key")
                {
                    if (++argIndex < args.Length)
                    {
                        accessKey = args[argIndex++];
                    }
                }
                else if (args[argIndex] == "--model_path")
                {
                    if (++argIndex < args.Length)
                    {
                        modelPath = args[argIndex++];
                    }
                }
                else if (args[argIndex] == "--disable_automatic_punctuation")
                {
                    enableAutomaticPunctuation = false;
                    argIndex++;
                }
                else if (args[argIndex] == "--disable_speaker_diarization")
                {
                    enableSpeakerDiarization = false;
                    argIndex++;
                }
                else if (args[argIndex] == "--verbose")
                {
                    verbose = true;
                    argIndex++;
                }
                else if (args[argIndex] == "--show_audio_devices")
                {
                    showAudioDevices = true;
                    argIndex++;
                }
                else if (args[argIndex] == "--audio_device_index")
                {
                    if (++argIndex < args.Length && int.TryParse(args[argIndex], out int deviceIndex))
                    {
                        audioDeviceIndex = deviceIndex;
                        argIndex++;
                    }
                }
                else if (args[argIndex] == "-h" || args[argIndex] == "--help")
                {
                    showHelp = true;
                    argIndex++;
                }
                else
                {
                    argIndex++;
                }
            }

            // print help text and exit
            if (showHelp)
            {
                Console.WriteLine(HELP_STR);
                Console.Read();
                return;
            }

            // print audio device info and exit
            if (showAudioDevices)
            {
                ShowAudioDevices();
                Console.Read();
                return;
            }

            // run demo with validated arguments
            RunDemo(
                accessKey,
                modelPath,
                enableAutomaticPunctuation,
                enableSpeakerDiarization,
                verbose,
                audioDeviceIndex);
        }

        private static void OnUnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            Console.WriteLine(e.ExceptionObject.ToString());
            Console.Read();
            Environment.Exit(1);
        }

        private static readonly string HELP_STR = "Available options: \n " +
            "\t--access_key (required): AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)\n" +
            "\t--model_path: Absolute path to the file containing model parameters.\n" +
            "\t--audio_device_index: Index of input audio device.\n" +
            "\t--show_audio_devices: Print available recording devices.\n" +
            "\t--disable_automatic_punctuation: Disable automatic punctuation.\n" +
            "\t--disable_speaker_diarization: Disable speaker diarization.\n" +
            "\t--verbose: Enable verbose output. Prints Leopard word metadata.";
    }
}