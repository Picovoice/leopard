/*
  Copyright 2022 Picovoice Inc.

  You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
  file accompanying this source.

  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
  specific language governing permissions and limitations under the License.
*/

/// <reference no-default-lib="false"/>
/// <reference lib="webworker" />

import { Leopard } from "./leopard";
import { LeopardWorkerRequest } from "./types";

/**
 * Leopard worker handler.
 */
let leopard: Leopard | null = null;
self.onmessage = async function (
  event: MessageEvent<LeopardWorkerRequest>
): Promise<void> {
  switch (event.data.command) {
    case 'init':
      if (leopard !== null) {
        self.postMessage({
          command: "error",
          message: "Leopard already initialized"
        });
        return;
      }
      try {
        Leopard.setWasm(event.data.wasm);
        Leopard.setWasmSimd(event.data.wasmSimd);
        leopard = await Leopard.create(event.data.accessKey, event.data.modelPath, event.data.initConfig);
        self.postMessage({
          command: "ok",
          version: leopard.version,
          sampleRate: leopard.sampleRate
        });
      } catch (e: any) {
        self.postMessage({
          command: "error",
          message: e.message
        });
      }
      break;
    case 'process':
      // eslint-disable-next-line no-case-declarations
      const transferable = (event.data.transfer) ? [event.data.inputFrame.buffer] : [];
      if (leopard === null) {
        self.postMessage({
          command: "error",
          message: "Leopard not initialized",
          inputFrame: event.data.inputFrame
        }, transferable);
        return;
      }
      try {
        self.postMessage({
          command: "ok",
          transcription: await leopard.process(event.data.inputFrame),
          inputFrame: (event.data.transfer) ? event.data.inputFrame : undefined
        }, transferable);
      } catch (e: any) {
        self.postMessage({
          command: "error",
          message: e.message,
          inputFrame: event.data.inputFrame
        }, transferable);
      }
      break;
    case 'release':
      if (leopard !== null) {
        await leopard.release();
        leopard = null;
      }
      self.postMessage({
        command: "ok"
      });
      break;
    default:
      self.postMessage({
        command: "failed",
        // @ts-ignore
        message: `Unrecognized command: ${event.data.command}`
      });
  }
};
