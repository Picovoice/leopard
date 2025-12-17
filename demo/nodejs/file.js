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
const fs = require("fs");

const { Leopard, LeopardActivationLimitReached } = require("@picovoice/leopard-node");


program
  .option(
    "-a, --access_key <string>",
    "AccessKey obtain from the Picovoice Console (https://console.picovoice.ai/)"
  )
  .option(
    "-i, --input_audio_file_path <string>",
    "input audio file"
  )
  .option(
    "-l, --library_file_path <string>",
    "absolute path to leopard dynamic library"
  )
  .option("-m, --model_file_path <string>", "absolute path to leopard model")
  .option(
    "-y, --device <string>",
    "Device to run inference on (`best`, `cpu:{num_threads}` or `gpu:{gpu_index}`). Default: selects best device")
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

function fileDemo() {
  let audioPath = program["input_audio_file_path"];
  let accessKey = program["access_key"]
  let libraryFilePath = program["library_file_path"];
  let modelFilePath = program["model_file_path"];
  let device = program["device"];
  let disableAutomaticPunctuation = program["disable_automatic_punctuation"];
  let disableSpeakerDiarization = program["disable_speaker_diarization"];
  let verbose = program["verbose"];

  const showInferenceDevices = program["show_inference_devices"];
  if (showInferenceDevices) {
    console.log(Leopard.listAvailableDevices().join('\n'));
    process.exit();
  }

  if (accessKey === undefined || audioPath === undefined) {
    console.error(
      "`--access_key` and `--input_audio_file_path` are required arguments"
    );
    return;
  }

  let engineInstance = new Leopard(
      accessKey,
      {
        'modelPath': modelFilePath,
        'device': device,
        'libraryPath': libraryFilePath,
        'enableAutomaticPunctuation': !disableAutomaticPunctuation,
        'enableDiarization': !disableSpeakerDiarization
      }
  );

  if (!fs.existsSync(audioPath)) {
    console.error(`--input_audio_file_path file not found: ${audioPath}`);
    return;
  }

  try {
    const res = engineInstance.processFile(audioPath);
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
  }

  engineInstance.release();
}

fileDemo();
