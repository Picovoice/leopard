#! /usr/bin/env node
//
// Copyright 2022-2025 Picovoice Inc.
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
const { Leopard, LeopardActivationLimitReached } = require("@picovoice/leopard-node");
const { PvRecorder } = require("@picovoice/pvrecorder-node");

const PV_RECORDER_FRAME_LENGTH = 2048;

program
  .option(
    "-a, --access_key <string>",
    "AccessKey obtain from the Picovoice Console (https://console.picovoice.ai/)"
  )
  .option(
    "-l, --library_file_path <string>",
    "absolute path to leopard dynamic library"
  )
  .option("-m, --model_file_path <string>", "absolute path to leopard model")
  .option(
    "-y, --device <string>",
    "Device to run inference on (`best`, `cpu:{num_threads}` or `gpu:{gpu_index}`). Default: selects best device")
  .option(
    "-i, --audio_device_index <number>",
    "index of audio device to use to record audio",
    Number,
    -1
  )
  .option("-s, --show_audio_devices", "show the list of available devices")
  .option("-p, --disable_automatic_punctuation", "disable automatic punctuation")
  .option("-d, --disable_speaker_diarization", "disable speaker diarization")
  .option(
      "-z, --show_inference_devices",
      "Print devices that are available to run Leopard inference.",
      false)
  .option("-v, --verbose", "verbose mode, prints metadata");

if (process.argv.length < 3) {
  program.help();
}
program.parse(process.argv);

let isInterrupted = false;

async function micDemo() {
  let accessKey = program["access_key"];
  let libraryFilePath = program["library_file_path"];
  let modelFilePath = program["model_file_path"];
  let device = program["device"];
  let audioDeviceIndex = program["audio_device_index"];
  let showAudioDevices = program["show_audio_devices"];
  let disableAutomaticPunctuation = program["disable_automatic_punctuation"];
  let disableSpeakerDiarization = program["disable_speaker_diarization"];
  let verbose = program["verbose"];

  const showInferenceDevices = program["show_inference_devices"];
  if (showInferenceDevices) {
    console.log(Leopard.listAvailableDevices().join('\n'));
    process.exit();
  }

  let showAudioDevicesDefined = showAudioDevices !== undefined;

  if (showAudioDevicesDefined) {
    const devices = PvRecorder.getAvailableDevices();
    for (let i = 0; i < devices.length; i++) {
      console.log(`index: ${i}, device name: ${devices[i]}`);
    }
    process.exit();
  }

  if (accessKey === undefined) {
    console.log("No AccessKey provided");
    process.exit();
  }

  let engineInstance = new Leopard(
      accessKey,
      {
        'modelPath': modelFilePath,
        'device': device,
        'libraryPath': libraryFilePath,
        'enableAutomaticPunctuation': !disableAutomaticPunctuation,
        'enableDiarization': !disableSpeakerDiarization
      });

  const recorder = new PvRecorder(PV_RECORDER_FRAME_LENGTH, audioDeviceIndex);

  console.log(`Using device: ${recorder.getSelectedDevice()}`);

  console.log(">>> Press `CTRL+C` to exit: ");

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);

  process.stdin.on("keypress", (key, str) => {

    if (str.sequence === '\r') {
      isInterrupted = true;
    } else if (str.sequence === '\x03') {
      recorder.release();
      engineInstance.release();
      process.exit();
    }
  });

  while (true) {
    console.log(">>> Recording ... Press `ENTER` to stop: ");
    let audioFrame = [];
    recorder.start();
    while (!isInterrupted) {
      const pcm = await recorder.read();
      audioFrame.push(...pcm);
    }
    console.log(">>> Processing ... ");
    recorder.stop();
    const audioFrameInt16 = new Int16Array(audioFrame);
    try {
      const res = engineInstance.process(audioFrameInt16)
      console.log(res.transcript);
      if (verbose) {
        console.table(
            res.words.map(word => {
              return {
                "Word": word.word,
                "Start time (s)": word.startSec.toFixed(2),
                "End time (s)": word.endSec.toFixed(2),
                "Confidence": word.confidence.toFixed(2),
                "Speaker Tag": word.speakerTag
              };
            })
        );
      }
    } catch (err) {
      if (err instanceof LeopardActivationLimitReached) {
        console.error(`AccessKey '${accessKey}' has reached it's processing limit.`);
      } else {
        console.error(err);
      }
      recorder.release();
      engineInstance.release();
      process.exit();
    }
    isInterrupted = false;
  }

}

micDemo();
