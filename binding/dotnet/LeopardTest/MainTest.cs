/*
    Copyright 2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
*/

using System.IO;
using System.Reflection;
using System.Collections.Generic;
using Microsoft.VisualStudio.TestTools.UnitTesting;

using Pv;
using System;

namespace LeopardTest
{
    [TestClass]
    public class MainTest
    {
        private static string ACCESS_KEY;

        private static string REF_TRANSCRIPT = "Mr quilter is the apostle of the middle classes and we are glad to welcome his gospel";

        private static string _relativeDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

/*        LeopardWord[] referenceTranscriptMetadata = {
            new LeopardWord("Mr", 0.95f, 0.58f, 0.80f),
            new LeopardWord("quilter", 0.80f, 0.86f, 1.18f),
            new LeopardWord("is", 0.96f, 1.31f, 1.38f),
            new LeopardWord("the", 0.90f, 1.44f, 1.50f),
            new LeopardWord("apostle", 0.79f, 1.57f, 2.08f),
            new LeopardWord("of", 0.98f, 2.18f, 2.24f),
            new LeopardWord("the", 0.98f, 2.30f, 2.34f),
            new LeopardWord("middle", 0.97f, 2.40f, 2.59f),
            new LeopardWord("classes", 0.98f, 2.69f, 3.17f),
            new LeopardWord("and", 0.95f, 3.36f, 3.46f),
            new LeopardWord("we", 0.96f, 3.52f, 3.55f),
            new LeopardWord("are", 0.97f, 3.65f, 3.65f),
            new LeopardWord("glad", 0.93f, 3.74f, 4.03f),
            new LeopardWord("to", 0.97f, 4.10f, 4.16f),
            new LeopardWord("welcome", 0.89f, 4.22f, 4.58f),
            new LeopardWord("his", 0.96f, 4.67f, 4.83f),
            new LeopardWord("gospel", 0.93f, 4.93f, 5.38f)};*/

        private List<short> GetPcmFromFile(string audioFilePath, int expectedSampleRate)
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

        [ClassInitialize]
        public static void ClassInitialize(TestContext _)
        {
            //ACCESS_KEY = Environment.GetEnvironmentVariable("ACCESS_KEY");
            ACCESS_KEY = "Nj93iN5VjmLvoeefKxrfqMXtzxYTAYiWo/tFb8JftF7IrNkpyGoyWw==";
        }

        [TestMethod]
        public void TestVersion()
        {
            using Leopard leopard = Leopard.Create(ACCESS_KEY);
            Assert.IsFalse(string.IsNullOrWhiteSpace(leopard?.Version), "Leopard did not return a valid version number.");
        }

        [TestMethod]
        public void TestProcessFile()
        {
            using Leopard leopard = Leopard.Create(ACCESS_KEY);
            string testAudioPath = Path.Combine(_relativeDir, "resources/audio_samples/test.wav");
            LeopardTranscript result = leopard.ProcessFile(testAudioPath);
            Assert.AreEqual(REF_TRANSCRIPT, result.TranscriptString);
        }

        //[TestMethod]
        //[DataRow(true, "Mr. Quilter is the apostle of the middle classes and we are glad to welcome his gospel.")]
        //[DataRow(false, "Mr quilter is the apostle of the middle classes and we are glad to welcome his gospel")]
        //public void TestProcess(bool enableAutomaticPunctuation, string expectedTranscript)
        //{
        //    using Leopard leopard = Leopard.Create(
        //        accessKey:ACCESS_KEY, 
        //        enableAutomaticPunctuation:enableAutomaticPunctuation);
        //    string testAudioPath = Path.Combine(_relativeDir, "resources/audio_samples/test.wav");
        //    List<short> pcm = GetPcmFromFile(testAudioPath, leopard.SampleRate);
        //    LeopardTranscript result = leopard.Process(pcm.ToArray());
        //    Assert.AreEqual(expectedTranscript, result.TranscriptString);
        //}

        //[TestMethod]
        //public void TestCustomModel()
        //{
        //    string testModelPath = Path.Combine(_relativeDir, "lib/common/leopard_params.pv");
        //    string testAudioPath = Path.Combine(_relativeDir, "resources/audio_samples/test.wav");
        //    using Leopard leopard = Leopard.Create(ACCESS_KEY, testModelPath);
        //    LeopardTranscript result = leopard.ProcessFile(testAudioPath);
        //    Assert.AreEqual(REF_TRANSCRIPT, result.TranscriptString);
        //}
    }
}
