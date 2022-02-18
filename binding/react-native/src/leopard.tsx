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

import { NativeModules } from 'react-native';
import * as LeopardErrors from './leopard_errors';

const RCTLeopard = NativeModules.PvLeopard;

type NativeError = {
  code: string;
  message: string;
};

class Leopard {
  private readonly _handle: string;
  private readonly _sampleRate: number;
  private readonly _version: string;

  /**
   * Static creator for initializing Leopard given the model path.
   * @param accessKey AccessKey obtained from Picovoice Console (https://console.picovoice.ai/).
   * @param modelPath Path to the file containing model parameters.
   * @returns An instance of the engine.
   */
  public static async create(accessKey: string, modelPath: string) {
    try {
      let { handle, sampleRate, version } = await RCTLeopard.create(
        accessKey,
        modelPath
      );
      return new Leopard(handle, sampleRate, version);
    } catch (err) {
      if (err instanceof LeopardErrors.LeopardError) {
        throw err;
      } else {
        const nativeError = err as NativeError;
        throw this.codeToError(nativeError.code, nativeError.message);
      }
    }
  }

  private constructor(handle: string, sampleRate: number, version: string) {
    this._handle = handle;
    this._sampleRate = sampleRate;
    this._version = version;
  }

  /**
   * Process a frame of audio with the speech-to-text engine.
   * @param frame An array of 16-bit pcm samples. The audio needs to have a sample rate equal to `.sampleRate` and be 16-bit
   *    linearly-encoded. This function operates on single-channel audio. If you wish to process data in a different
   *    sample rate or format consider using `.processFile`.
   * @returns {Promise} Inferred transcription.
   */
  async process(frame: number[]) {
    if (frame === undefined) {
      throw new LeopardErrors.LeopardInvalidArgumentError(
        'Frame array provided to process() is undefined or null'
      );
    }

    // sample the first frame to check for non-integer values
    if (!Number.isInteger(frame[0])) {
      throw new LeopardErrors.LeopardInvalidArgumentError(
        `Non-integer frame values provided to process(): ${frame[0]}. Leopard requires 16-bit integers`
      );
    }

    try {
      return await RCTLeopard.process(this._handle, frame);
    } catch (err) {
      const nativeError = err as NativeError;
      throw Leopard.codeToError(nativeError.code, nativeError.message);
    }
  }

  /**
   * Process a frame of audio with the speech-to-text engine.
   * @param audioPath Absolute path to the audio file. The file needs to have a sample rate equal to or greater
   *     than `Leopard.sampleRate`. The supported formats are: `FLAC`, `MP3`, `Ogg`, `Opus`,
   *     `Vorbis`, `WAV`, and `WebM`.
   * @returns {Promise} Inferred transcription.
   */
  async processFile(audioPath: string) {
    if (audioPath === undefined || audioPath === '') {
      throw new LeopardErrors.LeopardInvalidArgumentError(
        'Audio path provided is not set.'
      );
    }

    try {
      return await RCTLeopard.processFile(this._handle, audioPath);
    } catch (err) {
      const nativeError = err as NativeError;
      throw Leopard.codeToError(nativeError.code, nativeError.message);
    }
  }

  /**
   * Frees memory that was allocated for Leopard
   */
  async delete() {
    return RCTLeopard.delete(this._handle);
  }

  /**
   * Get the audio sample rate required by Leopard.
   * @returns Required sample rate.
   */
  get sampleRate() {
    return this._sampleRate;
  }

  /**
   * Gets the version number of the Leopard library.
   * @returns Version of Leopard
   */
  get version() {
    return this._version;
  }

  /**
   * Gets the Error type given a code.
   * @param code Code name of native Error.
   * @param message Detailed message of the error.
   */
  private static codeToError(code: string, message: string) {
    switch (code) {
      case 'LeopardException':
        return new LeopardErrors.LeopardError(message);
      case 'LeopardMemoryException':
        return new LeopardErrors.LeopardMemoryError(message);
      case 'LeopardIOException':
        return new LeopardErrors.LeopardIOError(message);
      case 'LeopardInvalidArgumentException':
        return new LeopardErrors.LeopardInvalidArgumentError(message);
      case 'LeopardStopIterationException':
        return new LeopardErrors.LeopardStopIterationError(message);
      case 'LeopardKeyException':
        return new LeopardErrors.LeopardKeyError(message);
      case 'LeopardInvalidStateException':
        return new LeopardErrors.LeopardInvalidStateError(message);
      case 'LeopardRuntimeException':
        return new LeopardErrors.LeopardRuntimeError(message);
      case 'LeopardActivationException':
        return new LeopardErrors.LeopardActivationError(message);
      case 'LeopardActivationLimitException':
        return new LeopardErrors.LeopardActivationLimitError(message);
      case 'LeopardActivationThrottledException':
        return new LeopardErrors.LeopardActivationThrottledError(message);
      case 'LeopardActivationRefusedException':
        return new LeopardErrors.LeopardActivationRefusedError(message);
      default:
        throw new Error(`unexpected code: ${code}, message: ${message}`);
    }
  }
}

export default Leopard;
