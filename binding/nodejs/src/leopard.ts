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

import * as fs from "fs";
import * as path from "path";

import PvStatus from "./pv_status_t";
import {
  LeopardInvalidArgumentError,
  LeopardInvalidStateError,
  pvStatusToException,
} from "./errors";

import { getSystemLibraryPath } from "./platforms";

const DEFAULT_MODEL_PATH = "../lib/common/leopard_params.pv";

const VALID_AUDIO_EXTENSIONS = [
  ".flac",
  ".mp3",
  ".ogg",
  ".opus",
  ".vorbis",
  ".wav",
  ".webm",
];

type LeopardHandleAndStatus = { handle: any; status: PvStatus };
type TranscriptAndStatus = { transcript: string; status: PvStatus };

/**
 * Node.js binding for Leopard speech-to-text engine.
 *
 * Performs the calls to the Leopard node library. Does some basic parameter validation to prevent
 * errors occurring in the library layer. Provides clearer error messages in native JavaScript.
 */
export default class Leopard {
  private _pvLeopard: any;

  private _handle: any;

  private readonly _version: string;
  private readonly _sampleRate: number;

  /**
   * Creates an instance of Leopard.
   * @param {string} accessKey AccessKey obtained from Picovoice Console (https://console.picovoice.ai/).
   * @param {string} modelPath the path to the Leopard model (.pv extension)
   * @param {string} libraryPath the path to the Leopard dynamic library (.node extension)
   */
  constructor(accessKey: string, modelPath?: string, libraryPath?: string) {
    if (
      accessKey === null ||
      accessKey === undefined ||
      accessKey.length === 0
    ) {
      throw new LeopardInvalidArgumentError(`No AccessKey provided to Leopard`);
    }

    if (modelPath === undefined || modelPath === null) {
      modelPath = path.resolve(__dirname, DEFAULT_MODEL_PATH);
    }

    if (libraryPath === undefined || modelPath === null) {
      libraryPath = getSystemLibraryPath();
    }

    if (!fs.existsSync(libraryPath)) {
      throw new LeopardInvalidArgumentError(
        `File not found at 'libraryPath': ${libraryPath}`
      );
    }

    if (!fs.existsSync(modelPath)) {
      throw new LeopardInvalidArgumentError(
        `File not found at 'modelPath': ${modelPath}`
      );
    }

    const pvLeopard = require(libraryPath);

    let leopardHandleAndStatus: LeopardHandleAndStatus | null = null;
    try {
      leopardHandleAndStatus = pvLeopard.init(accessKey, modelPath);
    } catch (err: any) {
      pvStatusToException(<PvStatus>err.code, err);
    }

    const status = leopardHandleAndStatus!.status;
    if (status !== PvStatus.SUCCESS) {
      pvStatusToException(status, "Leopard failed to initialize");
    }

    this._handle = leopardHandleAndStatus!.handle;
    this._pvLeopard = pvLeopard;
    this._sampleRate = pvLeopard.sample_rate();
    this._version = pvLeopard.version();
  }

  /**
   * @returns the audio sampling rate accepted by the process function
   * @see {@link process}
   */
  get sampleRate(): number {
    return this._sampleRate;
  }

  /**
   * @returns the version of the Leopard engine
   */
  get version(): string {
    return this._version;
  }

  /**
   * Processes a given audio data and returns its transcription.
   *
   * @param {Int16Array} pcm Audio data. The audio needs to have a sample rate equal to `Leopard.sampleRate` and be 16-bit linearly-encoded.
   * This function operates on single-channel audio. If you wish to process data in a different
   * sample rate or format consider using `Leopard.processFile()`.
   * @returns {string} Inferred transcription.
   */
  process(pcm: Int16Array): string {
    if (
      this._handle === 0 ||
      this._handle === null ||
      this._handle === undefined
    ) {
      throw new LeopardInvalidStateError("Leopard is not initialized");
    }

    if (pcm === undefined || pcm === null) {
      throw new LeopardInvalidArgumentError(
        `PCM array provided to 'Leopard.process()' is undefined or null`
      );
    } else if (pcm.length === 0) {
      throw new LeopardInvalidArgumentError(
        `PCM array provided to 'Leopard.process()' is empty`
      );
    }

    let transcriptAndStatus: TranscriptAndStatus | null = null;
    try {
      transcriptAndStatus = this._pvLeopard.process(
        this._handle,
        pcm,
        pcm.length
      );
    } catch (err: any) {
      pvStatusToException(<PvStatus>err.code, err);
    }

    const status = transcriptAndStatus!.status;
    if (status !== PvStatus.SUCCESS) {
      pvStatusToException(status, "Leopard failed to process the audio frame");
    }

    return transcriptAndStatus!.transcript;
  }

  /**
   * Processes a given audio file and returns its transcription.
   *
   * @param {string} audioPath Absolute path to the audio file.
   * The file needs to have a sample rate equal to or greater than `.sampleRate`.
   * The supported formats are: `FLAC`, `MP3`, `Ogg`, `Opus`, `Vorbis`, `WAV`, and `WebM`.
   * @returns {string} Inferred transcription.
   */
  processFile(audioPath: string): string {
    if (
      this._handle === 0 ||
      this._handle === null ||
      this._handle === undefined
    ) {
      throw new LeopardInvalidStateError("Leopard is not initialized");
    }

    if (!fs.existsSync(audioPath)) {
      throw new LeopardInvalidArgumentError(
        `Could not find the audio file at '${audioPath}'`
      );
    }

    let transcriptAndStatus: TranscriptAndStatus | null = null;
    try {
      transcriptAndStatus = this._pvLeopard.process_file(
        this._handle,
        audioPath
      );
    } catch (err: any) {
      pvStatusToException(<PvStatus>err.code, err);
    }

    const status = transcriptAndStatus!.status;
    if (status !== PvStatus.SUCCESS) {
      if (
        status === PvStatus.INVALID_ARGUMENT &&
        !VALID_AUDIO_EXTENSIONS.includes(path.extname(audioPath.toLowerCase()))
      ) {
        pvStatusToException(
          status,
          `Specified file with extension '${path.extname(
            audioPath.toLowerCase()
          )}' is not supported`
        );
      }
      pvStatusToException(status, "Leopard failed to process the audio file");
    }
    return transcriptAndStatus!.transcript;
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
      } catch (err: any) {
        pvStatusToException(<PvStatus>err.code, err);
      }
      this._handle = 0;
    } else {
      console.warn("Leopard is not initialized");
    }
  }
}
