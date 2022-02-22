//
// Copyright 2022 Picovoice Inc.
//
// You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
// file accompanying this source.
//
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
// an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.
//
"use strict";

const Leopard = require("./index.js");
const fs = require("fs");
const path = require("path");
const WaveFile = require("wavefile").WaveFile;

const { PvArgumentError } = require("./errors");
const { getPlatform, getSystemLibraryPath } = require("./platforms");

const MODEL_PATH = "./lib/common/leopard_params.pv";

const WAV_PATH = "../../resources/audio_samples/test.WAV";
const TRANSCRIPT = "MR QUILTER IS THE APOSTLE OF THE MIDDLE CLASSES AND WE ARE GLAD TO WELCOME HIS GOSPEL"

const libraryPath = getSystemLibraryPath();

const ACCESS_KEY = process.argv
  .filter((x) => x.startsWith("--access_key="))[0]
  .split("--access_key=")[1];

describe("Defaults", () => {
  test("successful processFile", () => {
    let leopardEngine = new Leopard(ACCESS_KEY);

    const waveFilePath = path.join(__dirname, WAV_PATH);
    let transcript = leopardEngine.processFile(waveFilePath);

    expect(transcript).toBe(TRANSCRIPT);

    leopardEngine.release();
  });

  test("successful process", () => {
    let leopardEngine = new Leopard(ACCESS_KEY);

    const waveFilePath = path.join(__dirname, WAV_PATH);
    const waveBuffer = fs.readFileSync(waveFilePath);
    const waveAudioFile = new WaveFile(waveBuffer);

    const pcm = waveAudioFile.getSamples(false, Int16Array)

    let transcript = leopardEngine.process(pcm);

    expect(transcript).toBe(TRANSCRIPT);

    leopardEngine.release();
  });

  test("Empty AccessKey", () => {
    expect(() => {
      let leopardEngine = new Leopard('');
    }).toThrow(PvArgumentError);
  });

});

describe("manual paths", () => {
  test("manual model path", () => {
    let leopardEngine = new Leopard(ACCESS_KEY, MODEL_PATH);

    const waveFilePath = path.join(__dirname, WAV_PATH);
    let transcript = leopardEngine.processFile(waveFilePath);

    expect(transcript).toBe(TRANSCRIPT);

    leopardEngine.release();
  });

  test("manual model and library path", () => {
    let leopardEngine = new Leopard(
      ACCESS_KEY, 
      MODEL_PATH,
      libraryPath);

    const waveFilePath = path.join(__dirname, WAV_PATH);
    let transcript = leopardEngine.processFile(waveFilePath);

    expect(transcript).toBe(TRANSCRIPT);

    leopardEngine.release();
  });
});