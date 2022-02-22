#! /usr/bin/env node
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

const { program } = require("commander");
const readline = require("readline");
const Leopard = require("@picovoice/leopard-node");
const PvRecorder = require("@picovoice/pvrecorder-node");

program
  .option(
    "-a, --access_key <string>",
    "AccessKey obtain from the Picovoice Console (https://console.picovoice.ai/)"
  )
  .option(
    "-l, --library_file_path <string>",
    "absolute path to rhino dynamic library"
  )
  .option("-m, --model_file_path <string>", "absolute path to rhino model")
  .option(
    "-i, --audio_device_index <number>",
    "index of audio device to use to record audio",
    Number,
    -1
  )
  .option("-d, --show_audio_devices", "show the list of available devices");

if (process.argv.length < 1) {
  program.help();
}
program.parse(process.argv);

let isInterrupted = false;

function VuMeter(pcm, width) {
  let sum = 0;
  const blackBox = "█";
  const emptyBox = " ";
  const minDB = -30;

  for (let i = 0; i < pcm.length; i++) {
    sum += Math.pow(pcm[i], 2);
  }
  const loudnessDb =
    10 * Math.log10((sum + 0.0001) / pcm.length / Math.pow(0xffff, 2));

  const volume = Math.max(
    0,
    Math.floor(((loudnessDb - minDB) * width) / -minDB)
  );
  return `${blackBox.repeat(volume)}${emptyBox.repeat(width - volume)}`;
}

async function micDemo() {
  let accessKey = program["access_key"];
  let libraryFilePath = program["library_file_path"];
  let modelFilePath = program["model_file_path"];
  let audioDeviceIndex = program["audio_device_index"];
  let showAudioDevices = program["show_audio_devices"];

  let showAudioDevicesDefined = showAudioDevices !== undefined;

  if (showAudioDevicesDefined) {
    const devices = PvRecorder.getAudioDevices();
    for (let i = 0; i < devices.length; i++) {
      console.log(`index: ${i}, device name: ${devices[i]}`);
    }
    process.exit();
  }

  if (accessKey === undefined) {
    console.log("No AccessKey provided");
    process.exit();
  }

  let engineInstance = new Leopard(accessKey, modelFilePath, libraryFilePath);

  const recorder = new PvRecorder(audioDeviceIndex, 512);
  recorder.start();

  console.log(`Using device: ${recorder.getSelectedDevice()}`);

  console.log(
    "Recording... Press `ENTER` to stop:"
  );

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);

  process.stdin.on("keypress", (key, str) => {
    if (str.name === 'return') {
      isInterrupted = true;
    }
  });

  let audioFrame = [];
  while (!isInterrupted) {
    const pcm = await recorder.read();
    process.stdout.write(`\r${VuMeter(pcm, 20)}`);
    audioFrame.push(...pcm);
  }
  recorder.stop();
  recorder.release();

  console.log("\nProcessing...");
  const audioFrameInt16 = new Int16Array(audioFrame);
  let transcript = engineInstance.process(audioFrameInt16);
  console.log(transcript);
  engineInstance.release();
  process.exit();
}

micDemo();
