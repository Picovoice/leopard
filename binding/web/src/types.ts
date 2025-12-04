/*
  Copyright 2022-2023 Picovoice Inc.

  You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
  file accompanying this source.

  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
  specific language governing permissions and limitations under the License.
*/

import { PvModel } from '@picovoice/web-utils';

export enum PvStatus {
  SUCCESS = 10000,
  OUT_OF_MEMORY,
  IO_ERROR,
  INVALID_ARGUMENT,
  STOP_ITERATION,
  KEY_ERROR,
  INVALID_STATE,
  RUNTIME_ERROR,
  ACTIVATION_ERROR,
  ACTIVATION_LIMIT_REACHED,
  ACTIVATION_THROTTLED,
  ACTIVATION_REFUSED,
}

/**
 * LeopardModel types
 */
export type LeopardModel = PvModel;

export type LeopardOptions = {
  /** @defaultValue undefined */
  device?: string;
  /** @defaultValue false */
  enableAutomaticPunctuation?: boolean;
  /** @defaultValue false */
  enableDiarization?: boolean;
};

export type LeopardWord = {
  /** Transcribed word. */
  word: string;
  /** Start of word in seconds. */
  startSec: number;
  /** End of word in seconds. */
  endSec: number;
  /** Transcription confidence. It is a number within [0, 1]. */
  confidence: number;
  /** The speaker tag is `-1` if diarization is not enabled during initialization;
   * otherwise, it's a non-negative integer identifying unique speakers, with `0` reserved for
   * unknown speakers. */
  speakerTag: number;
};

export type LeopardTranscript = {
  transcript: string;
  words: LeopardWord[];
};

export type LeopardWorkerInitRequest = {
  command: 'init';
  accessKey: string;
  modelPath: string;
  options: LeopardOptions;
  wasmSimd: string;
  wasmSimdLib: string;
  wasmPThread: string;
  wasmPThreadLib: string;
  sdk: string;
};

export type LeopardWorkerProcessRequest = {
  command: 'process';
  inputFrame: Int16Array;
  transfer: boolean;
};

export type LeopardWorkerReleaseRequest = {
  command: 'release';
};

export type LeopardWorkerRequest =
  | LeopardWorkerInitRequest
  | LeopardWorkerProcessRequest
  | LeopardWorkerReleaseRequest;

export type LeopardWorkerFailureResponse = {
  command: 'failed' | 'error';
  status: PvStatus;
  shortMessage: string;
  messageStack: string[];
};

export type LeopardWorkerInitResponse =
  | LeopardWorkerFailureResponse
  | {
      command: 'ok';
      sampleRate: number;
      version: string;
    };

export type LeopardWorkerProcessResponse =
  | LeopardWorkerFailureResponse
  | {
      command: 'ok';
      result: LeopardTranscript;
      inputFrame?: Int16Array;
    };

export type LeopardWorkerReleaseResponse =
  | LeopardWorkerFailureResponse
  | {
      command: 'ok';
    };

export type LeopardWorkerResponse =
  | LeopardWorkerInitResponse
  | LeopardWorkerProcessResponse
  | LeopardWorkerReleaseResponse;
