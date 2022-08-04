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

import {
  Leopard,
  LeopardInvalidArgumentError
} from "../src";

import * as fs from "fs";
import * as path from "path";
import {WaveFile} from "wavefile";

import {getSystemLibraryPath} from "../src/platforms";

const MODEL_PATH = "./lib/common/leopard_params.pv";

const WAV_PATH = "../../../resources/audio_samples/test.wav";
const TRANSCRIPT =
  "Mr quilter is the apostle of the middle classes and we are glad to welcome his gospel";

const libraryPath = getSystemLibraryPath();

const ACCESS_KEY = process.argv
  .filter((x) => x.startsWith("--access_key="))[0]
  .split("--access_key=")[1];

describe("Defaults", () => {
  test("successful processFile", () => {
    let leopardEngine = new Leopard(ACCESS_KEY);

    const waveFilePath = path.join(__dirname, WAV_PATH);
    let res = leopardEngine.processFile(waveFilePath);

    expect(res.transcript).toBe(TRANSCRIPT);

    leopardEngine.release();
  });

  test("successful process", () => {
    let leopardEngine = new Leopard(ACCESS_KEY);

    const waveFilePath = path.join(__dirname, WAV_PATH);
    const waveBuffer = fs.readFileSync(waveFilePath);
    const waveAudioFile = new WaveFile(waveBuffer);

    const pcm: any = waveAudioFile.getSamples(false, Int16Array);

    let res = leopardEngine.process(pcm);

    expect(res.transcript).toBe(TRANSCRIPT);

    leopardEngine.release();
  });

  test("Empty AccessKey", () => {
    expect(() => {
      new Leopard("");
    }).toThrow(LeopardInvalidArgumentError);
  });
});

describe("manual paths", () => {
  test("manual model path", () => {
    let leopardEngine = new Leopard(
      ACCESS_KEY,
      {'modelPath': MODEL_PATH});

    const waveFilePath = path.join(__dirname, WAV_PATH);
    let res = leopardEngine.processFile(waveFilePath);

    expect(res.transcript).toBe(TRANSCRIPT);

    leopardEngine.release();
  });

  test("manual model and library path", () => {
    let leopardEngine = new Leopard(
      ACCESS_KEY,
      {modelPath: MODEL_PATH, libraryPath: libraryPath, enableAutomaticPunctuation: false});

    const waveFilePath = path.join(__dirname, WAV_PATH);
    let res = leopardEngine.processFile(waveFilePath);

    expect(res.transcript).toBe(TRANSCRIPT);

    leopardEngine.release();
  });

  test("Enable automatic punctuation", () => {
    let leopardEngine = new Leopard(
      ACCESS_KEY,
      {modelPath: MODEL_PATH, libraryPath: libraryPath, enableAutomaticPunctuation: true});

    const waveFilePath = path.join(__dirname, WAV_PATH);
    let res = leopardEngine.processFile(waveFilePath);

    expect(res.transcript).toBe("Mr. Quilter is the apostle of the middle classes and we are glad to welcome his gospel.");

    leopardEngine.release();
  });

  test("Words info", () => {
    let leopardEngine = new Leopard(ACCESS_KEY, {modelPath: MODEL_PATH});

    const waveFilePath = path.join(__dirname, WAV_PATH);
    let res = leopardEngine.processFile(waveFilePath);
    expect(res.words.length).toBe(17);
    expect(res.words[0].word).toBe("Mr");
    expect(res.words[0].startSec).toBeGreaterThan(0)
    expect(res.words[0].endSec).toBeGreaterThan(res.words[0].startSec)
    expect(res.words[0].confidence).toBeGreaterThan(0)

    leopardEngine.release();
  });
});
