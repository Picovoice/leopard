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
using System.Runtime.InteropServices;

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
        private static readonly string ROOT_DIR = Path.Combine(AppContext.BaseDirectory, "../../../../../..");

        [ClassInitialize]
        public static void ClassInitialize(TestContext _)
        {
            _accessKey = Environment.GetEnvironmentVariable("ACCESS_KEY");
        }

        [Serializable]
        private class TestJson
        {
            public LanguageTestJson[] language_tests { get; set; }
            public DiarizationTestJson[] diarization_tests { get; set; }
        }

        [Serializable]
        private class LanguageTestJson
        {
            public string language { get; set; }
            public string audio_file { get; set; }
            public string transcript { get; set; }

            public string transcript_with_punctuation { get; set; }
            public float error_rate { get; set; }
            public WordJson[] words { get; set; }
        }

        [Serializable]
        private class DiarizationTestJson
        {
            public string language { get; set; }
            public string audio_file { get; set; }
            public WordJson[] words { get; set; }
        }

        [Serializable]
        private class WordJson
        {
            public string word { get; set; }
            public float start_sec { get; set; }
            public float end_sec { get; set; }
            public float confidence { get; set; }
            public Int32 speaker_tag { get; set; }
        }

        private static TestJson LoadJsonTestData()
        {
            string content = File.ReadAllText(Path.Combine(ROOT_DIR, "resources/.test/test_data.json"));
            return JObject.Parse(content)["tests"].ToObject<TestJson>();
        }

        private static IEnumerable<object[]> ProcessTestParameters
        {
            get
            {
                TestJson testDataJson = LoadJsonTestData();
                object[][] processTestParameters = new object[testDataJson.language_tests.Length][];
                for (int i = 0; i < testDataJson.language_tests.Length; i++)
                {
                    WordJson[] wordsJson = testDataJson.language_tests[i].words;
                    LeopardWord[] words = new LeopardWord[wordsJson.Length];
                    for (int j = 0; j < wordsJson.Length; j++)
                    {
                        words[j] = new LeopardWord(
                            wordsJson[j].word,
                            wordsJson[j].confidence,
                            wordsJson[j].start_sec,
                            wordsJson[j].end_sec,
                            wordsJson[j].speaker_tag);
                    }
                    processTestParameters[i] = new object[]
                    {
                        testDataJson.language_tests[i].language,
                        testDataJson.language_tests[i].audio_file,
                        testDataJson.language_tests[i].transcript,
                        testDataJson.language_tests[i].transcript_with_punctuation,
                        testDataJson.language_tests[i].error_rate,
                        words
                    };
                }

                return processTestParameters;
            }
        }

        private static IEnumerable<object[]> DiarizationTestParameters
        {
            get
            {
                TestJson testDataJson = LoadJsonTestData();
                object[][] processTestParameters = new object[testDataJson.diarization_tests.Length][];
                for (int i = 0; i < testDataJson.diarization_tests.Length; i++)
                {
                    WordJson[] wordsJson = testDataJson.diarization_tests[i].words;
                    LeopardWord[] words = new LeopardWord[wordsJson.Length];
                    for (int j = 0; j < wordsJson.Length; j++)
                    {
                        words[j] = new LeopardWord(
                            wordsJson[j].word,
                            0,
                            0,
                            0,
                            wordsJson[j].speaker_tag);
                    }
                    processTestParameters[i] = new object[]
                    {
                        testDataJson.diarization_tests[i].language,
                        testDataJson.diarization_tests[i].audio_file,
                        words
                    };
                }

                return processTestParameters;
            }
        }

        private static string AppendLanguage(string s, string language)
        {
            return language == "en" ? s : $"{s}_{language}";
        }

        private static float GetErrorRate(string transcript, string referenceTranscript)
        {
            return Levenshtein.Distance(transcript, referenceTranscript) / (float)referenceTranscript.Length;
        }

        private static string GetModelPath(string language)
        {
            return Path.Combine(
                ROOT_DIR,
                "lib/common",
                $"{AppendLanguage("leopard_params", language)}.pv");
        }

        private static short[] GetPcmFromFile(string audioFilePath, int expectedSampleRate)
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

            return data.ToArray();
        }

        private static void ValidateMetadata(
            LeopardWord[] words,
            LeopardWord[] referenceWords,
            bool enableDiarization)
        {
            Assert.AreEqual(words.Length, referenceWords.Length);
            for (int i = 0; i < words.Length; i++)
            {
                Assert.AreEqual(words[i].Word.ToUpper(), referenceWords[i].Word.ToUpper());
                Assert.AreEqual(words[i].StartSec, referenceWords[i].StartSec, 0.1);
                Assert.AreEqual(words[i].EndSec, referenceWords[i].EndSec, 0.1);
                Assert.AreEqual(words[i].Confidence, referenceWords[i].Confidence, 0.1);
                if (enableDiarization)
                {
                    Assert.AreEqual(words[i].SpeakerTag, referenceWords[i].SpeakerTag);
                }
                else
                {
                    Assert.AreEqual(words[i].SpeakerTag, -1);
                }
            }
        }

        [TestMethod]
        public void TestVersion()
        {
            using (Leopard leopard = Leopard.Create(_accessKey))
            {
                Assert.IsFalse(
                    string.IsNullOrWhiteSpace(leopard?.Version),
                    "Leopard did not return a valid version number.");
            }
        }

        [TestMethod]
        public void TestSampleRate()
        {
            using (Leopard leopard = Leopard.Create(_accessKey))
            {
                Assert.IsTrue(
                    leopard.SampleRate > 0,
                    "Leopard did not return a valid sample rate number.");
            }
        }

        [TestMethod]
        public void TestMessageStack()
        {
            Leopard l;
            string[] messageList = new string[] { };

            try
            {
                l = Leopard.Create("invalid");
                Assert.IsNull(l);
                l.Dispose();
            }
            catch (LeopardException e)
            {
                messageList = e.MessageStack;
            }

            Assert.IsTrue(0 < messageList.Length);
            Assert.IsTrue(messageList.Length < 8);

            try
            {
                l = Leopard.Create("invalid");
                Assert.IsNull(l);
                l.Dispose();
            }
            catch (LeopardException e)
            {
                for (int i = 0; i < messageList.Length; i++)
                {
                    Assert.AreEqual(messageList[i], e.MessageStack[i]);
                }
            }
        }

        [TestMethod]
        public void TestProcessMessageStack()
        {
            Leopard l = Leopard.Create(_accessKey);
            short[] testPcm = new short[1024];

            var obj = typeof(Leopard).GetField("_libraryPointer", BindingFlags.NonPublic | BindingFlags.Instance);
            IntPtr address = (IntPtr)obj.GetValue(l);
            obj.SetValue(l, IntPtr.Zero);

            try
            {
                LeopardTranscript res = l.Process(testPcm);
                Assert.IsTrue(res == null);
            }
            catch (LeopardException e)
            {
                Assert.IsTrue(0 < e.MessageStack.Length);
                Assert.IsTrue(e.MessageStack.Length < 8);
            }

            obj.SetValue(l, address);
            l.Dispose();
        }


        [TestMethod]
        [DynamicData(nameof(ProcessTestParameters))]
        public void TestProcess(
            string language,
            string testAudioFile,
            string referenceTranscript,
            string _,
            float targetErrorRate,
            LeopardWord[] referenceWords)
        {
            using (Leopard leopard = Leopard.Create(
                       _accessKey,
                       GetModelPath(language)))
            {
                string testAudioPath = Path.Combine(ROOT_DIR, "resources/audio_samples", testAudioFile);

                LeopardTranscript result = leopard.Process(GetPcmFromFile(testAudioPath, leopard.SampleRate));

                float errorRate = GetErrorRate(result.TranscriptString.ToUpper(), referenceTranscript.ToUpper());
                Assert.IsTrue(errorRate < targetErrorRate);

                ValidateMetadata(result.WordArray, referenceWords, false);
            }
        }

        [TestMethod]
        [DynamicData(nameof(ProcessTestParameters))]
        public void TestProcessFile(
            string language,
            string testAudioFile,
            string referenceTranscript,
            string _,
            float targetErrorRate,
            LeopardWord[] referenceWords)
        {
            using (Leopard leopard = Leopard.Create(
                       _accessKey,
                       GetModelPath(language)))
            {
                string testAudioPath = Path.Combine(ROOT_DIR, "resources/audio_samples", testAudioFile);
                LeopardTranscript result = leopard.ProcessFile(testAudioPath);

                float errorRate = GetErrorRate(result.TranscriptString.ToUpper(), referenceTranscript.ToUpper());
                Assert.IsTrue(errorRate < targetErrorRate);

                ValidateMetadata(result.WordArray, referenceWords, false);
            }
        }

        [TestMethod]
        [DynamicData(nameof(ProcessTestParameters))]
        public void TestProcessFileWithPunctuation(
            string language,
            string testAudioFile,
            string _,
            string referenceTranscript,
            float targetErrorRate,
            LeopardWord[] referenceWords)
        {
            using (Leopard leopard = Leopard.Create(
                       _accessKey,
                       GetModelPath(language),
                       enableAutomaticPunctuation: true))
            {
                string testAudioPath = Path.Combine(ROOT_DIR, "resources/audio_samples", testAudioFile);
                LeopardTranscript result = leopard.ProcessFile(testAudioPath);

                float errorRate = GetErrorRate(result.TranscriptString.ToUpper(), referenceTranscript.ToUpper());
                Assert.IsTrue(errorRate < targetErrorRate);

                ValidateMetadata(result.WordArray, referenceWords, false);
            }
        }

        [TestMethod]
        [DynamicData(nameof(ProcessTestParameters))]
        public void TestProcessFileWithDiarization(
            string language,
            string testAudioFile,
            string referenceTranscript,
            string _,
            float targetErrorRate,
            LeopardWord[] referenceWords)
        {
            using (Leopard leopard = Leopard.Create(
                       _accessKey,
                       GetModelPath(language),
                       enableDiarization: true))
            {
                string testAudioPath = Path.Combine(ROOT_DIR, "resources/audio_samples", testAudioFile);
                LeopardTranscript result = leopard.ProcessFile(testAudioPath);

                float errorRate = GetErrorRate(result.TranscriptString.ToUpper(), referenceTranscript.ToUpper());
                Assert.IsTrue(errorRate < targetErrorRate);

                ValidateMetadata(result.WordArray, referenceWords, true);
            }
        }

        [TestMethod]
        [DynamicData(nameof(DiarizationTestParameters))]
        public void TestDiarization(
            string language,
            string testAudioFile,
            LeopardWord[] referenceWords)
        {
            using (Leopard leopard = Leopard.Create(
                       _accessKey,
                       GetModelPath(language),
                       enableDiarization: true))
            {
                string testAudioPath = Path.Combine(ROOT_DIR, "resources/audio_samples", testAudioFile);
                LeopardWord[] words = leopard.ProcessFile(testAudioPath).WordArray;

                Assert.AreEqual(words.Length, referenceWords.Length);
                for (int i = 0; i < words.Length; i++)
                {
                    Assert.AreEqual(words[i].Word.ToUpper(), referenceWords[i].Word.ToUpper());
                    Assert.AreEqual(words[i].SpeakerTag, referenceWords[i].SpeakerTag);
                }
            }
        }
    }
}