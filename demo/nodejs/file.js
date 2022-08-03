#! /usr/bin/env node
//
// Copyright 2020 Picovoice Inc.
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
  .requiredOption(
    "-a, --access_key <string>",
    "AccessKey obtain from the Picovoice Console (https://console.picovoice.ai/)"
  )
  .requiredOption(
    "-i, --input_audio_file_path <string>",
    "input audio file"
  )
  .option(
    "-l, --library_file_path <string>",
    "absolute path to leopard dynamic library"
  )
  .option("-m, --model_file_path <string>", "absolute path to leopard model")
  .option("-d, --disable_automatic_punctuation", "disable automatic punctuation")
  .option("-v, --verbose", "verbose mode, prints metadata");


if (process.argv.length < 2) {
  program.help();
}
program.parse(process.argv);

function fileDemo() {
  let audioPath = program["input_audio_file_path"];
  let accessKey = program["access_key"]
  let libraryFilePath = program["library_file_path"];
  let modelFilePath = program["model_file_path"];
  let disableAutomaticPunctuation = program["disable_automatic_punctuation"];
  let verbose = program["verbose"];

  let engineInstance = new Leopard(
      accessKey,
      {
        'modelPath': modelFilePath,
        'libraryPath': libraryFilePath,
        'enableAutomaticPunctuation': !disableAutomaticPunctuation
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
      console.table(res.words);
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
