import { Leopard } from "./leopard";
import { LeopardWorker } from "./leopard_worker";

import {
  LeopardConfig,
  LeopardWorkerInitRequest,
  LeopardWorkerProcessRequest,
  LeopardWorkerReleaseRequest,
  LeopardWorkerRequest,
  LeopardWorkerInitResponse,
  LeopardWorkerProcessResponse,
  LeopardWorkerReleaseResponse,
  LeopardWorkerFailureResponse,
  LeopardWorkerResponse
} from "./types";

import leopardWasm from "../lib/pv_leopard.wasm";

Leopard.setWasm(leopardWasm);
LeopardWorker.setWasm(leopardWasm);

export {
  Leopard,
  LeopardConfig,
  LeopardWorker,
  LeopardWorkerInitRequest,
  LeopardWorkerProcessRequest,
  LeopardWorkerReleaseRequest,
  LeopardWorkerRequest,
  LeopardWorkerInitResponse,
  LeopardWorkerProcessResponse,
  LeopardWorkerReleaseResponse,
  LeopardWorkerFailureResponse,
  LeopardWorkerResponse
};
