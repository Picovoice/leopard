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

import leopardWasm from '../lib/pv_leopard.wasm';
import leopardWasmSimd from '../lib/pv_leopard_simd.wasm';

Leopard.setWasm(leopardWasm);
Leopard.setWasmSimd(leopardWasmSimd);
LeopardWorker.setWasm(leopardWasm);
LeopardWorker.setWasmSimd(leopardWasmSimd);

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
