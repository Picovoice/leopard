/*
  Copyright 2022 Picovoice Inc.

  You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
  file accompanying this source.

  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
  specific language governing permissions and limitations under the License.
*/

export type LeopardWorkerInitRequest = {
  command: 'init';
  accessKey: string;
  modelPath: string;
  wasm: string;
};

export type LeopardWorkerProcessRequest = {
  command: 'process';
  pcm: Int16Array;
};

export type LeopardWorkerReleaseRequest = {
  command: 'release';
};

export type LeopardWorkerRequest =
  LeopardWorkerInitRequest |
  LeopardWorkerProcessRequest |
  LeopardWorkerReleaseRequest;

export type LeopardWorkerFailureResponse = {
  command: 'failed' | 'error';
  message: string;
};

export type LeopardWorkerInitResponse = LeopardWorkerFailureResponse | {
  command: 'ok';
  sampleRate: number;
  version: string;
};

export type LeopardWorkerProcessResponse = LeopardWorkerFailureResponse | {
  command: 'ok';
  transcription: string;
};

export type LeopardWorkerReleaseResponse = LeopardWorkerFailureResponse | {
  command: 'ok';
};

export type LeopardWorkerResponse =
  LeopardWorkerInitResponse |
  LeopardWorkerProcessResponse |
  LeopardWorkerReleaseResponse;
