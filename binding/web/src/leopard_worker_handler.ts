/*
  Copyright 2022-2025 Picovoice Inc.

  You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
  file accompanying this source.

  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
  specific language governing permissions and limitations under the License.
*/

/// <reference no-default-lib="false"/>
/// <reference lib="webworker" />

import { Leopard } from './leopard';
import {
  LeopardWorkerInitRequest,
  LeopardWorkerProcessRequest,
  LeopardWorkerRequest,
  PvStatus,
} from './types';
import { LeopardError } from './leopard_errors';

let leopard: Leopard | null = null;

const initRequest = async (request: LeopardWorkerInitRequest): Promise<any> => {
  if (leopard !== null) {
    return {
      command: 'error',
      status: PvStatus.INVALID_STATE,
      shortMessage: 'Leopard already initialized',
    };
  }
  try {
    Leopard.setWasmSimd(request.wasmSimd);
    Leopard.setWasmSimdLib(request.wasmSimdLib);
    Leopard.setWasmPThread(request.wasmPThread);
    Leopard.setWasmPThreadLib(request.wasmPThreadLib);
    Leopard.setSdk(request.sdk);
    leopard = await Leopard._init(
      request.accessKey,
      request.modelPath,
      request.options
    );
    return {
      command: 'ok',
      version: leopard.version,
      sampleRate: leopard.sampleRate,
    };
  } catch (e: any) {
    if (e instanceof LeopardError) {
      return {
        command: 'error',
        status: e.status,
        shortMessage: e.shortMessage,
        messageStack: e.messageStack,
      };
    }
    return {
      command: 'error',
      status: PvStatus.RUNTIME_ERROR,
      shortMessage: e.message,
    };
  }
};

const processRequest = async (
  request: LeopardWorkerProcessRequest
): Promise<any> => {
  if (leopard === null) {
    return {
      command: 'error',
      status: PvStatus.INVALID_STATE,
      shortMessage: 'Leopard not initialized',
      inputFrame: request.inputFrame,
    };
  }
  try {
    return {
      command: 'ok',
      result: await leopard.process(request.inputFrame),
      inputFrame: request.transfer ? request.inputFrame : undefined,
    };
  } catch (e: any) {
    if (e instanceof LeopardError) {
      return {
        command: 'error',
        status: e.status,
        shortMessage: e.shortMessage,
        messageStack: e.messageStack,
      };
    }
    return {
      command: 'error',
      status: PvStatus.RUNTIME_ERROR,
      shortMessage: e.message,
    };
  }
};

const releaseRequest = async (): Promise<any> => {
  if (leopard !== null) {
    await leopard.release();
    leopard = null;
    close();
  }
  return {
    command: 'ok',
  };
};

/**
 * Leopard worker handler.
 */
self.onmessage = async function (
  event: MessageEvent<LeopardWorkerRequest>
): Promise<void> {
  switch (event.data.command) {
    case 'init':
      self.postMessage(await initRequest(event.data));
      break;
    case 'process':
      self.postMessage(
        await processRequest(event.data),
        event.data.transfer ? [event.data.inputFrame.buffer] : []
      );
      break;
    case 'release':
      self.postMessage(await releaseRequest());
      break;
    default:
      self.postMessage({
        command: 'failed',
        status: PvStatus.RUNTIME_ERROR,
        // @ts-ignore
        shortMessage: `Unrecognized command: ${event.data.command}`,
      });
  }
};
