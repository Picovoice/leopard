/*
    Copyright 2022-2023 Picovoice Inc.

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

using Fastenshtein;

using Microsoft.VisualStudio.TestTools.UnitTesting;

using Newtonsoft.Json.Linq;

using Pv;

namespace LeopardTest
{
    [TestClass]
    public class MainTest
    {
        private static string _accessKey;
        private static readonly string ROOT_DIR = Path.Combine(
            Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location),
            "../../../../../..");


        [ClassInitialize]
        public static void ClassInitialize(TestContext _)
        {
            _accessKey = Environment.GetEnvironmentVariable("ACCESS_KEY");
        }

        private static List<short> GetPcmFromFile(string audioFilePath, int expectedSampleRate)
        {
            List<short> data = new List<short>();
            using (BinaryReader reader = new BinaryReader(File.Open(audioFilePath, FileMode.Open)))
            {
                reader.ReadBytes(24); // skip over part of the header
                Assert.AreEqual(reader.ReadInt32(), expectedSampleRate, "Specified sample rate did not match test file.");
                reader.ReadBytes(16); // skip over the rest of the header

                while (reader.BaseStream.Position != reader.BaseStream.Length)
                {
                    data.Add(reader.ReadInt16());
                }
            }

            return data;
        }


        private static JObject LoadJsonTestData()
        {
            string content = File.ReadAllText(Path.Combine(ROOT_DIR, "resources/test/test_data.json"));
            return JObject.Parse(content);
        }

        [Serializable]
        private class TestParameterJson
        {
            public string language { get; set; }
            public string audio_file { get; set; }
            public string transcript { get; set; }

            public string[] punctuations { get; set; }

            public float error_rate { get; set; }
        }

        public static IEnumerable<object[]> TestParameters
        {
            get
            {
                JObject testDataJson = LoadJsonTestData();
                IList<TestParameterJson> testParametersJson = ((JArray)testDataJson["tests"]["parameters"]).ToObject<IList<TestParameterJson>>();
                List<object[]> testParameters = new List<object[]>();
                foreach (TestParameterJson t in testParametersJson)
                {
                    testParameters.Add(new object[]
                    {
                        t.language,
                        t.audio_file,
                        t.transcript,
                        true,
                        t.error_rate
                    });

                    string transcriptWithoutPunctuation = t.transcript;
                    foreach (string p in t.punctuations)
                    {
                        transcriptWithoutPunctuation = transcriptWithoutPunctuation.Replace(p, "");
                    }

                    testParameters.Add(new object[]
                    {
                        t.language,
                        t.audio_file,
                        transcriptWithoutPunctuation,
                        false,
                        t.error_rate
                    });
                }
                return testParameters;

            }
        }

        private static string AppendLanguage(string s, string language)
            => language == "en" ? s : $"{s}_{language}";

        private static string GetModelPath(string language)
            => Path.Combine(
                ROOT_DIR,
                "lib/common",
                $"{AppendLanguage("leopard_params", language)}.pv");

        static float GetErrorRate(string transcript, string referenceTranscript)
            => Levenshtein.Distance(transcript, referenceTranscript) / (float)referenceTranscript.Length;

        private static void ValidateMetadata(LeopardWord[] words, string transcript, float audioLength)
        {
            string normTranscript = transcript.ToUpper();
            for (int i = 0; i < words.Length; i++)
            {
                Assert.IsTrue(normTranscript.Contains(words[i].Word.ToUpper()));
                Assert.IsTrue(words[i].StartSec > 0);
                Assert.IsTrue(words[i].StartSec <= words[i].EndSec);
                if (i < words.Length - 1)
                {
                    Assert.IsTrue(words[i].EndSec <= words[i + 1].StartSec);
                }
                else
                {
                    Assert.IsTrue(words[i].EndSec <= audioLength);
                }
                Assert.IsTrue(words[i].Confidence >= 0.0f && words[i].Confidence <= 1.0f);
            }
        }

        [TestMethod]
        public void TestVersion()
        {
            using (Leopard leopard = Leopard.Create(_accessKey))
            {
                Assert.IsFalse(string.IsNullOrWhiteSpace(leopard?.Version), "Leopard did not return a valid version number.");
            }
        }

        [TestMethod]
        public void TestSampleRate()
        {
            using (Leopard leopard = Leopard.Create(_accessKey))
            {
                Assert.IsTrue(leopard.SampleRate > 0, "Leopard did not return a valid sample rate number.");
            }
        }

        [TestMethod]
        [DynamicData(nameof(TestParameters))]
        public void TestProcessFile(
            string language,
            string testAudioFile,
            string referenceTranscript,
            bool enablePunctuation,
            float targetErrorRate)
        {
            using (Leopard leopard = Leopard.Create(
                _accessKey,
                modelPath: GetModelPath(language),
                enableAutomaticPunctuation: enablePunctuation
            ))
            {

                string testAudioPath = Path.Combine(ROOT_DIR, "resources/audio_samples", testAudioFile);
                LeopardTranscript result = leopard.ProcessFile(testAudioPath);

                string transcript = result.TranscriptString;
                if (!enablePunctuation)
                {
                    referenceTranscript = referenceTranscript.ToUpper();
                    transcript = transcript.ToUpper();
                }

                Assert.IsTrue(GetErrorRate(transcript, referenceTranscript) < targetErrorRate);

                float audioLength = GetPcmFromFile(testAudioPath, leopard.SampleRate).Count / (float)leopard.SampleRate;
                ValidateMetadata(result.WordArray, referenceTranscript, audioLength);
            }
        }

        [TestMethod]
        [DynamicData(nameof(TestParameters))]
        public void TestProcess(
            string language,
            string testAudioFile,
            string referenceTranscript,
            bool enablePunctuation,
            float targetErrorRate)
        {
            using (Leopard leopard = Leopard.Create(
                _accessKey,
                modelPath: GetModelPath(language),
                enableAutomaticPunctuation: enablePunctuation
            ))
            {
                string testAudioPath = Path.Combine(ROOT_DIR, "resources/audio_samples", testAudioFile);

                List<short> pcm = GetPcmFromFile(testAudioPath, leopard.SampleRate);
                LeopardTranscript result = leopard.Process(pcm.ToArray());

                string transcript = result.TranscriptString;
                if (!enablePunctuation)
                {
                    referenceTranscript = referenceTranscript.ToUpper();
                    transcript = transcript.ToUpper();
                }

                Assert.IsTrue(GetErrorRate(transcript, referenceTranscript) < targetErrorRate);

                float audioLength = pcm.Count / (float)leopard.SampleRate;
                ValidateMetadata(result.WordArray, referenceTranscript, audioLength);
            }
        }
    }
}