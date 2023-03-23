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

using Pv;

namespace LeopardDemo
{
    /// <summary>
    /// File Demo for Leopard Speech-to-Text engine. The demo takes an input audio file and returns prints the the transcription.
    /// </summary>                
    public class FileDemo
    {

        /// <summary>
        /// Reads through input file and prints the transcription returned by Leopard.
        /// </summary>
        /// <param name="inputAudioPath">Required argument. Absolute path to input audio file.</param>
        /// <param name="accessKey">AccessKey obtained from Picovoice Console (https://console.picovoice.ai/).</param>
        /// <param name="modelPath">Absolute path to the file containing model parameters. If not set it will be set to the default location.</param>
        /// <param name="enableAutomaticPunctuation">
        /// Set to `true` to enable automatic punctuation insertion.
        /// </param>
        /// <param name="verbose">
        /// Enable verbose logging.
        /// </param>
        /// 
        public static void RunDemo(
            string accessKey,
            string inputAudioPath,
            string modelPath,
            bool enableAutomaticPunctuation,
            bool verbose
            )
        {
            // init Leopard speech-to-text engine
            using Leopard leopard = Leopard.Create(
                accessKey: accessKey,
                modelPath: modelPath,
                enableAutomaticPunctuation: enableAutomaticPunctuation);

            try
            {
                LeopardTranscript result = leopard.ProcessFile(inputAudioPath);
                Console.WriteLine(result.TranscriptString);
                if (verbose)
                {
                    Console.WriteLine(String.Format("\n|{0,-15}|{1,-10:0.00}|{2,-10:0.00}|{3,-10:0.00}|\n", "word", "Confidence", "StartSec", "EndSec"));
                    for (int i = 0; i < result.WordArray.Length; i++)
                    {
                        LeopardWord word = result.WordArray[i];
                        Console.WriteLine(String.Format("|{0,-15}|{1,10:0.00}|{2,10:0.00}|{3,10:0.00}|", word.Word, word.Confidence, word.StartSec, word.EndSec));
                    }
                }
            }
            catch (LeopardActivationLimitException)
            {
                Console.WriteLine($"AccessKey '{accessKey}' has reached it's processing limit.");
            }
            finally
            {
                leopard.Dispose();
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

            string inputAudioPath = null;
            string accessKey = null;
            string modelPath = null;
            bool enableAutomaticPunctuation = true;
            bool verbose = true;
            bool showHelp = false;

            // parse command line arguments
            int argIndex = 0;
            while (argIndex < args.Length)
            {
                if (args[argIndex] == "--input_audio_path")
                {
                    if (++argIndex < args.Length)
                    {
                        inputAudioPath = args[argIndex++];
                    }
                }
                else if (args[argIndex] == "--access_key")
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
                else if (args[argIndex] == "--verbose")
                {
                    verbose = true;
                    argIndex++;
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

            // argument validation
            if (string.IsNullOrEmpty(inputAudioPath))
            {
                throw new ArgumentNullException("input_audio_path");
            }
            if (!File.Exists(inputAudioPath))
            {
                throw new ArgumentException($"Audio file at path {inputAudioPath} does not exist", "--input_audio_path");
            }

            RunDemo(
                accessKey,
                inputAudioPath,
                modelPath,
                enableAutomaticPunctuation,
                verbose);
        }

        private static void OnUnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            Console.WriteLine(e.ExceptionObject.ToString());
            Console.Read();
            Environment.Exit(1);
        }

        private static readonly string HELP_STR = "Available options: \n" +
            "\t--input_audio_path (required): Absolute path to input audio file.\n" +
            "\t--access_key (required): AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)\n" +
            "\t--model_path: Absolute path to the file containing model parameters.\n" +
            "\t--disable_automatic_punctuation: Disable automatic punctuation.\n" +
            "\t--verbose: Enable verbose logging";
    }
}