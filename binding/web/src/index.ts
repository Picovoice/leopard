import { Leopard } from './leopard';
import { LeopardWorker } from './leopard_worker';

import {
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

import leopardWasm from '../lib/pv_leopard.wasm';
import leopardWasmSimd from '../lib/pv_leopard_simd.wasm';

Leopard.setWasm(leopardWasm);
Leopard.setWasmSimd(leopardWasmSimd);
LeopardWorker.setWasm(leopardWasm);
LeopardWorker.setWasmSimd(leopardWasmSimd);

export {
  Leopard,
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
