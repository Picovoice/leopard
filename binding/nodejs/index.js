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

const fs = require("fs");
const path = require("path");

const PV_STATUS_T = require("./pv_status_t");
const {
  PvArgumentError,
  PvStateError,
  pvStatusToException,
} = require("./errors");

const { getSystemLibraryPath } = require("./platforms");

const MODEL_PATH_DEFAULT = "lib/common/leopard_params.pv";

const VALID_AUDIO_EXTENSIONS = [
  ".flac",
  ".mp3",
  ".ogg",
  ".opus",
  ".vorbis",
  ".wav",
  ".webm"
];

/**
 * Wraps the Leopard engine.
 *
 * Performs the calls to the Leopard node library. Does some basic parameter validation to prevent
 * errors occurring in the library layer. Provides clearer error messages in native JavaScript.
 */
class Leopard {
  /**
   * Creates an instance of Leopard.
   * @param {string} accessKey AccessKey obtained from Picovoice Console (https://console.picovoice.ai/).
   * @param {string} manualModelPath the path to the Leopard model (.pv extension)
   * @param {string} manualLibraryPath the path to the Leopard dynamic library (platform-dependent extension)
   */
  constructor(accessKey, manualModelPath, manualLibraryPath) {
    if (
      accessKey === null ||
      accessKey === undefined ||
      accessKey.length === 0
    ) {
      throw new PvArgumentError(`No AccessKey provided to Leopard`);
    }

    let modelPath = manualModelPath;
    if (modelPath === undefined || modelPath === null) {
      modelPath = path.resolve(__dirname, MODEL_PATH_DEFAULT);
    }

    let libraryPath = manualLibraryPath;
    if (libraryPath === undefined || modelPath === null) {
      libraryPath = getSystemLibraryPath();
    }

    if (!fs.existsSync(libraryPath)) {
      throw new PvArgumentError(
        `File not found at 'libraryPath': ${libraryPath}`
      );
    }

    if (!fs.existsSync(modelPath)) {
      throw new PvArgumentError(`File not found at 'modelPath': ${modelPath}`);
    }

    const pvLeopard = require(libraryPath);

    let leopardHandleAndStatus = null;
    try {
      leopardHandleAndStatus = pvLeopard.init(accessKey, modelPath);
    } catch (err) {
      pvStatusToException(PV_STATUS_T[err.code], err);
    }

    const status = leopardHandleAndStatus.status;
    if (status !== PV_STATUS_T.SUCCESS) {
      pvStatusToException(status, "Leopard failed to initialize");
    }

    this._handle = leopardHandleAndStatus.handle;
    this._pvLeopard = pvLeopard;
    this._sampleRate = pvLeopard.sample_rate();
    this._version = pvLeopard.version();
  }

  /**
   * @returns the audio sampling rate accepted by the process function
   * @see {@link process}
   */
  get sampleRate() {
    return this._sampleRate;
  }

  /**
   * @returns the version of the Leopard engine
   */
  get version() {
    return this._version;
  }

  /**
   * Processes a given audio data and returns its transcription.
   *
   * @param {Array} pcm Audio data. The audio needs to have a sample rate equal to `.sampleRate` and be 16-bit linearly-encoded.
   * This function operates on single-channel audio. If you wish to process data in a different
   * sample rate or format consider using `.processFile`.
   * @returns {string} Inferred transcription.
   */
  process(pcm) {
    if (
      this._handle === 0 ||
      this._handle === null ||
      this._handle === undefined
    ) {
      throw new PvStateError("Leopard is not initialized");
    }

    if (pcm === undefined || pcm === null) {
      throw new PvArgumentError(
        `PCM array provided to process() is undefined or null`
      );
    } else if (pcm.length === 0) {
      throw new PvArgumentError(`PCM array provided to process() is empty`);
    }

    let transcriptAndStatus = null;
    try {
      transcriptAndStatus = this._pvLeopard.process(
        this._handle,
        pcm,
        pcm.length
      );
    } catch (err) {
      pvStatusToException(PV_STATUS_T[err.code], err);
    }

    const status = transcriptAndStatus.status;
    if (status !== PV_STATUS_T.SUCCESS) {
      pvStatusToException(status, "Leopard failed to process the audio frame");
    }

    return transcriptAndStatus.transcript;
  }

  /**
   * Processes a given audio file and returns its transcription.
   *
   * @param {string} audioPath Absolute path to the audio file.
   * The file needs to have a sample rate equal to or greater than `.sampleRate`.
   * The supported formats are: `FLAC`, `MP3`, `Ogg`, `Opus`, `Vorbis`, `WAV`, and `WebM`.
   * @returns {string} Inferred transcription.
   */
  processFile(audioPath) {
    if (
      this._handle === 0 ||
      this._handle === null ||
      this._handle === undefined
    ) {
      throw new PvStateError("Leopard is not initialized");
    }

    if (!fs.existsSync(audioPath)) {
      throw new PvArgumentError(
        `Could not find the audio file at '${audioPath}'`
      );
    }

    if (VALID_AUDIO_EXTENSIONS.includes(path.extname(audioPath.toLowerCase()))) {
      throw new PvArgumentError(
        `Unsupported audio file: '${path.extname(audioPath.toLowerCase())}'`
      );
    }

    let transcriptAndStatus = null;
    try {
      transcriptAndStatus = this._pvLeopard.process_file(this._handle, audioPath);
    } catch (err) {
      pvStatusToException(PV_STATUS_T[err.code], err);
    }

    const status = transcriptAndStatus.status;
    if (status !== PV_STATUS_T.SUCCESS) {
      pvStatusToException(status, "Leopard failed to process the audio file");
    }
    return transcriptAndStatus.transcript;
  }

  /**
   * Releases the resources acquired by Leopard.
   *
   * Be sure to call this when finished with the instance
   * to reclaim the memory that was allocated by the C library.
   */
  release() {
    if (this._handle !== 0) {
      try {
        this._pvLeopard.delete(this._handle);
      } catch (err) {
        pvStatusToException(PV_STATUS_T[err.code], err);
      }
      this._handle = 0;
    } else {
      console.warn("Leopard is not initialized");
    }
  }
}

module.exports = Leopard;
