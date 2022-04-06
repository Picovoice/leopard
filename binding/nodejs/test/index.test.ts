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

import { Leopard, LeopardInvalidArgumentError } from "../src";
import * as fs from "fs";
import * as path from "path";
import { performance } from "perf_hooks";
import { WaveFile } from "wavefile";

import { getSystemLibraryPath } from "../src/platforms";

const MODEL_PATH = "./lib/common/leopard_params.pv";

const WAV_PATH = "../../../resources/audio_samples/test.wav";
const TRANSCRIPT =
  "MR QUILTER IS THE APOSTLE OF THE MIDDLE CLASSES AND WE ARE GLAD TO WELCOME HIS GOSPEL";

const libraryPath = getSystemLibraryPath();

const ACCESS_KEY = process.argv
  .filter((x) => x.startsWith("--access_key="))[0]
  .split("--access_key=")[1];

const INIT_PERFORMANCE_THRESHOLD_SEC = Number(
  process.argv
    .filter((x) => x.startsWith("--init_performance_threshold_sec="))[0]
    ?.split("--init_performance_threshold_sec=")[1] ?? 0
);

const PROC_PERFORMANCE_THRESHOLD_SEC = Number(
  process.argv
    .filter((x) => x.startsWith("--proc_performance_threshold_sec="))[0]
    ?.split("--proc_performance_threshold_sec=")[1] ?? 0
);

const describe_if = (condition: boolean) =>
  condition ? describe : describe.skip;

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

    const pcm: any = waveAudioFile.getSamples(false, Int16Array);

    let transcript = leopardEngine.process(pcm);

    expect(transcript).toBe(TRANSCRIPT);

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
    let leopardEngine = new Leopard(ACCESS_KEY, MODEL_PATH);

    const waveFilePath = path.join(__dirname, WAV_PATH);
    let transcript = leopardEngine.processFile(waveFilePath);

    expect(transcript).toBe(TRANSCRIPT);

    leopardEngine.release();
  });

  test("manual model and library path", () => {
    let leopardEngine = new Leopard(ACCESS_KEY, MODEL_PATH, libraryPath);

    const waveFilePath = path.join(__dirname, WAV_PATH);
    let transcript = leopardEngine.processFile(waveFilePath);

    expect(transcript).toBe(TRANSCRIPT);

    leopardEngine.release();
  });
});

describe_if(
  INIT_PERFORMANCE_THRESHOLD_SEC > 0 && PROC_PERFORMANCE_THRESHOLD_SEC > 0
)("performance", () => {
  test("process", () => {
    const waveFilePath = path.join(__dirname, WAV_PATH);

    const beforeInit = performance.now();
    let leopardEngine = new Leopard(ACCESS_KEY);
    const afterInit = performance.now();

    const beforeProc = performance.now();
    leopardEngine.processFile(waveFilePath);
    const afterProc = performance.now();

    leopardEngine.release();

    let totalInit = Number(((afterInit - beforeInit) / 1000).toFixed(3));
    let totalProc = Number(((afterProc - beforeProc) / 1000).toFixed(3));
    console.log(totalInit);
    console.log(totalProc);
    expect(totalInit).toBeLessThanOrEqual(INIT_PERFORMANCE_THRESHOLD_SEC);
    expect(totalProc).toBeLessThanOrEqual(PROC_PERFORMANCE_THRESHOLD_SEC);
  });
});
