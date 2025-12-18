import { Leopard } from './leopard';
import { LeopardWorker } from './leopard_worker';
import * as LeopardErrors from './leopard_errors';

import {
  LeopardModel,
  LeopardOptions,
  LeopardWord,
  LeopardTranscript,
  LeopardWorkerInitRequest,
  LeopardWorkerProcessRequest,
  LeopardWorkerReleaseRequest,
  LeopardWorkerRequest,
  LeopardWorkerInitResponse,
  LeopardWorkerProcessResponse,
  LeopardWorkerReleaseResponse,
  LeopardWorkerFailureResponse,
  LeopardWorkerResponse,
} from './types';

import leopardWasmSimd from './lib/pv_leopard_simd.wasm';
import leopardWasmSimdLib from './lib/pv_leopard_simd.txt';
import leopardWasmPThread from './lib/pv_leopard_pthread.wasm';
import leopardWasmPThreadLib from './lib/pv_leopard_pthread.txt';

Leopard.setWasmSimd(leopardWasmSimd);
Leopard.setWasmSimdLib(leopardWasmSimdLib);
Leopard.setWasmPThread(leopardWasmPThread);
Leopard.setWasmPThreadLib(leopardWasmPThreadLib);
LeopardWorker.setWasmSimd(leopardWasmSimd);
LeopardWorker.setWasmSimdLib(leopardWasmSimdLib);
LeopardWorker.setWasmPThread(leopardWasmPThread);
LeopardWorker.setWasmPThreadLib(leopardWasmPThreadLib);

export {
  Leopard,
  LeopardErrors,
  LeopardModel,
  LeopardOptions,
  LeopardWord,
  LeopardTranscript,
  LeopardWorker,
  LeopardWorkerInitRequest,
  LeopardWorkerProcessRequest,
  LeopardWorkerReleaseRequest,
  LeopardWorkerRequest,
  LeopardWorkerInitResponse,
  LeopardWorkerProcessResponse,
  LeopardWorkerReleaseResponse,
  LeopardWorkerFailureResponse,
  LeopardWorkerResponse,
};
