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

        private static string REF_TRANSCRIPT = "MR QUILTER IS THE APOSTLE OF THE MIDDLE CLASSES AND WE ARE GLAD TO WELCOME HIS GOSPEL";

        private static string _relativeDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

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
            ACCESS_KEY = Environment.GetEnvironmentVariable("ACCESS_KEY");
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
            string transcript = leopard.ProcessFile(testAudioPath);
            Assert.AreEqual(REF_TRANSCRIPT, transcript);
        }

        [TestMethod]
        public void TestProcess()
        {
            using Leopard leopard = Leopard.Create(ACCESS_KEY);
            string testAudioPath = Path.Combine(_relativeDir, "resources/audio_samples/test.wav");
            List<short> pcm = GetPcmFromFile(testAudioPath, leopard.SampleRate);
            string transcript = leopard.Process(pcm.ToArray());
            Assert.AreEqual(REF_TRANSCRIPT, transcript);
        }

        [TestMethod]
        public void TestCustomModel()
        {
            string testModelPath = Path.Combine(_relativeDir, "lib/common/leopard_params.pv");
            string testAudioPath = Path.Combine(_relativeDir, "resources/audio_samples/test.wav");
            using Leopard leopard = Leopard.Create(ACCESS_KEY, testModelPath);
            string transcript = leopard.ProcessFile(testAudioPath);
            Assert.AreEqual(REF_TRANSCRIPT, transcript);
        }
    }
}
