/*
  Copyright 2022-2025 Picovoice Inc.

  You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
  file accompanying this source.

  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
  specific language governing permissions and limitations under the License.
*/

/* eslint camelcase: 0 */

import { Mutex } from 'async-mutex';

import { simd } from 'wasm-feature-detect';

import {
  arrayBufferToStringAtIndex,
  base64ToUint8Array,
  isAccessKeyValid,
  loadModel,
} from '@picovoice/web-utils';

import createModuleSimd from "./lib/pv_leopard_simd";
import createModulePThread from "./lib/pv_leopard_pthread";

import {
  LeopardModel,
  LeopardOptions,
  LeopardTranscript,
  LeopardWord,
  PvStatus,
} from './types';
import { pvStatusToException } from './leopard_errors';
import * as LeopardErrors from './leopard_errors';

/**
 * WebAssembly function types
 */

type pv_leopard_init_type = (
  accessKey: number,
  modelPath: number,
  device: number,
  enableAutomaticPunctuation: number,
  enableDiarization: number,
  object: number
) => Promise<number>;
type pv_leopard_process_type = (
  object: number,
  pcm: number,
  numSamples: number,
  transcript: number,
  numWords: number,
  words: number
) => Promise<number>;
type pv_leopard_delete_type = (object: number) => void;
type pv_leopard_transcript_delete_type = (transcript: number) => void;
type pv_leopard_words_delete_type = (words: number) => void;
type pv_sample_rate_type = () => number;
type pv_leopard_version_type = () => number;
type pv_set_sdk_type = (sdk: number) => void;
type pv_get_error_stack_type = (
  messageStack: number,
  messageStackDepth: number
) =>number;
type pv_free_error_stack_type = (messageStack: number) => void;

type LeopardModule = EmscriptenModule & {
  _pv_free: (address: number) => void;

  _pv_leopard_transcript_delete: pv_leopard_transcript_delete_type;
  _pv_leopard_words_delete: pv_leopard_words_delete_type;
  _pv_sample_rate: pv_sample_rate_type;
  _pv_leopard_version: pv_leopard_version_type;

  _pv_set_sdk: pv_set_sdk_type;
  _pv_get_error_stack: pv_get_error_stack_type;
  _pv_free_error_stack: pv_free_error_stack_type;

  // em default functions
  addFunction: typeof addFunction;
  ccall: typeof ccall;
  cwrap: typeof cwrap;
}

type LeopardWasmOutput = {
  module: LeopardModule;

  pv_leopard_process: pv_leopard_process_type;
  pv_leopard_delete: pv_leopard_delete_type;

  version: string;
  sampleRate: number;

  objectAddress: number;
  transcriptAddressAddress: number;
  numWordsAddress: number;
  wordsAddressAddress: number;
  messageStackAddressAddressAddress: number;
  messageStackDepthAddress: number;
};

const MAX_PCM_LENGTH_SEC = 60 * 15;

export class Leopard {
  private _module?: LeopardModule;

  private readonly _pv_leopard_process: pv_leopard_process_type;
  private readonly _pv_leopard_delete: pv_leopard_delete_type;

  private readonly _sampleRate: number;
  private readonly _version: string;

  private readonly _processMutex: Mutex;
  private readonly _objectAddress: number;
  private readonly _transcriptAddressAddress: number;
  private readonly _numWordsAddress: number;
  private readonly _wordsAddressAddress: number;
  private readonly _messageStackAddressAddressAddress: number;
  private readonly _messageStackDepthAddress: number;

  private static _wasmSimd: string;
  private static _wasmSimdLib: string;
  private static _wasmPThread: string;
  private static _wasmPThreadLib: string;
  private static _sdk: string = 'web';

  private static _leopardMutex = new Mutex();

  private constructor(handleWasm: LeopardWasmOutput) {
    this._module = handleWasm.module;

    this._pv_leopard_process = handleWasm.pv_leopard_process;
    this._pv_leopard_delete = handleWasm.pv_leopard_delete;

    this._version = handleWasm.version;
    this._sampleRate = handleWasm.sampleRate;

    this._objectAddress = handleWasm.objectAddress;
    this._transcriptAddressAddress = handleWasm.transcriptAddressAddress;
    this._numWordsAddress = handleWasm.numWordsAddress;
    this._wordsAddressAddress = handleWasm.wordsAddressAddress;
    this._messageStackAddressAddressAddress =
      handleWasm.messageStackAddressAddressAddress;
    this._messageStackDepthAddress = handleWasm.messageStackDepthAddress;

    this._processMutex = new Mutex();
  }

  /**
   * Get Leopard engine version.
   */
  get version(): string {
    return this._version;
  }

  /**
   * Get sample rate.
   */
  get sampleRate(): number {
    return this._sampleRate;
  }

  /**
   * Set base64 wasm file with SIMD feature.
   * @param wasmSimd Base64'd wasm file to use to initialize wasm.
   */
  public static setWasmSimd(wasmSimd: string): void {
    if (this._wasmSimd === undefined) {
      this._wasmSimd = wasmSimd;
    }
  }

  /**
   * Set base64 SIMD wasm file in text format.
   * @param wasmSimdLib Base64'd wasm file in text format.
   */
  public static setWasmSimdLib(wasmSimdLib: string): void {
    if (this._wasmSimdLib === undefined) {
      this._wasmSimdLib = wasmSimdLib;
    }
  }

  /**
   * Set base64 wasm file with SIMD and pthread feature.
   * @param wasmPThread Base64'd wasm file to use to initialize wasm.
   */
  public static setWasmPThread(wasmPThread: string): void {
    if (this._wasmPThread === undefined) {
      this._wasmPThread = wasmPThread;
    }
  }

  /**
   * Set base64 SIMD and thread wasm file in text format.
   * @param wasmPThreadLib Base64'd wasm file in text format.
   */
  public static setWasmPThreadLib(wasmPThreadLib: string): void {
    if (this._wasmPThreadLib === undefined) {
      this._wasmPThreadLib = wasmPThreadLib;
    }
  }

  public static setSdk(sdk: string): void {
    Leopard._sdk = sdk;
  }

  /**
   * Creates an instance of the Picovoice Leopard Speech-to-Text engine.
   * Behind the scenes, it requires the WebAssembly code to load and initialize before
   * it can create an instance.
   *
   * @param accessKey AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)
   * @param model Leopard model options.
   * @param model.base64 The model in base64 string to initialize Leopard.
   * @param model.publicPath The model path relative to the public directory.
   * @param model.customWritePath Custom path to save the model in storage.
   * Set to a different name to use multiple models across `leopard` instances.
   * @param model.forceWrite Flag to overwrite the model in storage even if it exists.
   * @param model.version Version of the model file. Increment to update the model file in storage.
   * @param options Optional arguments.
   * @param options.device String representation of the device (e.g., CPU or GPU) to use. If set to `best`, the most
   * suitable device is selected automatically. If set to `gpu`, the engine uses the first available GPU device. To select a specific
   * GPU device, set this argument to `gpu:${GPU_INDEX}`, where `${GPU_INDEX}` is the index of the target GPU. If set to
   * `cpu`, the engine will run on the CPU with the default number of threads. To specify the number of threads, set this
   * argument to `cpu:${NUM_THREADS}`, where `${NUM_THREADS}` is the desired number of threads.
   * @param options.enableAutomaticPunctuation Flag to enable automatic punctuation insertion.
   * @param options.enableDiarization Flag to enable speaker diarization, which allows Leopard to differentiate speakers
   * as part of the transcription process. Word metadata will include a `speakerTag` to identify unique speakers.
   *
   * @returns An instance of the Leopard engine.
   */
  public static async create(
    accessKey: string,
    model: LeopardModel,
    options: LeopardOptions = {}
  ): Promise<Leopard> {
    const customWritePath = model.customWritePath
      ? model.customWritePath
      : 'leopard_model';
    const modelPath = await loadModel({ ...model, customWritePath });

    return await Leopard._init(accessKey, modelPath, options);
  }

  public static async _init(
    accessKey: string,
    modelPath: string,
    options: LeopardOptions = {}
  ): Promise<Leopard> {
    let {
      device = "best",
    } = options;
    const {
      enableAutomaticPunctuation = false,
      enableDiarization = false,
    } = options;

    if (!isAccessKeyValid(accessKey)) {
      throw new LeopardErrors.LeopardInvalidArgumentError('Invalid AccessKey');
    }

    const isSimd = await simd();
    if (!isSimd) {
      throw new LeopardErrors.LeopardRuntimeError('Browser not supported.');
    }

    const isWorkerScope =
      typeof WorkerGlobalScope !== 'undefined' &&
      self instanceof WorkerGlobalScope;
    if (
      !isWorkerScope &&
      (device === 'best' || (device.startsWith('cpu') && device !== 'cpu:1'))
    ) {
      // eslint-disable-next-line no-console
      console.warn('Multi-threading is not supported on main thread.');
      device = 'cpu:1';
    }

    const sabDefined = typeof SharedArrayBuffer !== 'undefined'
      && (device !== "cpu:1");

    return new Promise<Leopard>((resolve, reject) => {
      Leopard._leopardMutex
        .runExclusive(async () => {
          const wasmOutput = await Leopard.initWasm(
            accessKey.trim(),
            modelPath,
            device,
            enableAutomaticPunctuation,
            enableDiarization,
            (sabDefined) ? this._wasmPThread : this._wasmSimd,
            (sabDefined) ? this._wasmPThreadLib : this._wasmSimdLib,
            (sabDefined) ? createModulePThread : createModuleSimd,
          );
          return new Leopard(wasmOutput);
        })
        .then((result: Leopard) => {
          resolve(result);
        })
        .catch((error: any) => {
          reject(error);
        });
    });
  }

  /**
   * Processes audio. The required sample rate can be retrieved from '.sampleRate'. The audio needs to be
   * 16-bit linearly-encoded. Furthermore, the engine operates on single-channel audio.
   *
   * @param pcm A frame of audio with properties described above.
   * @return The transcript.
   */
  public async process(pcm: Int16Array): Promise<LeopardTranscript> {
    if (!(pcm instanceof Int16Array)) {
      throw new LeopardErrors.LeopardInvalidArgumentError(
        "The argument 'pcm' must be provided as an Int16Array"
      );
    }

    const maxSize = MAX_PCM_LENGTH_SEC * this._sampleRate;
    if (pcm.length > maxSize) {
      throw new LeopardErrors.LeopardInvalidArgumentError(
        `'pcm' size must be smaller than ${maxSize}`
      );
    }

    return new Promise<LeopardTranscript>((resolve, reject) => {
      this._processMutex
        .runExclusive(async () => {
          if (this._module === undefined) {
            throw new LeopardErrors.LeopardInvalidStateError(
              'Attempted to call Leopard process after release.'
            );
          }

          const inputBufferAddress = this._module._malloc(pcm.length * Int16Array.BYTES_PER_ELEMENT);
          if (inputBufferAddress === 0) {
            throw new LeopardErrors.LeopardOutOfMemoryError(
              'malloc failed: Cannot allocate memory'
            );
          }
          this._module.HEAP16.set(
            pcm,
            inputBufferAddress / Int16Array.BYTES_PER_ELEMENT
          );
          const status = await this._pv_leopard_process(
            this._objectAddress,
            inputBufferAddress,
            pcm.length,
            this._transcriptAddressAddress,
            this._numWordsAddress,
            this._wordsAddressAddress
          );
          this._module._pv_free(inputBufferAddress);

          if (status !== PvStatus.SUCCESS) {
            const messageStack = await Leopard.getMessageStack(
              this._module._pv_get_error_stack,
              this._module._pv_free_error_stack,
              this._messageStackAddressAddressAddress,
              this._messageStackDepthAddress,
              this._module.HEAP32,
              this._module.HEAPU8
            );

            throw pvStatusToException(status, 'Process failed', messageStack);
          }

          const transcriptAddress = this._module.HEAP32[this._transcriptAddressAddress / Int32Array.BYTES_PER_ELEMENT];

          const transcript = arrayBufferToStringAtIndex(
            this._module.HEAPU8,
            transcriptAddress
          );

          const numWords = this._module.HEAP32[this._numWordsAddress / Int32Array.BYTES_PER_ELEMENT];
          const wordsAddress = this._module.HEAP32[this._wordsAddressAddress / Int32Array.BYTES_PER_ELEMENT];

          let ptr = wordsAddress;
          const words: LeopardWord[] = [];
          for (let i = 0; i < numWords; i++) {
            const wordAddress = this._module.HEAP32[ptr / Int32Array.BYTES_PER_ELEMENT];
            const word = arrayBufferToStringAtIndex(
              this._module.HEAPU8,
              wordAddress
            );
            ptr += Uint32Array.BYTES_PER_ELEMENT;
            const startSec = this._module.HEAPF32[ptr / Float32Array.BYTES_PER_ELEMENT];
            ptr += Uint32Array.BYTES_PER_ELEMENT;
            const endSec = this._module.HEAPF32[ptr / Float32Array.BYTES_PER_ELEMENT];
            ptr += Uint32Array.BYTES_PER_ELEMENT;
            const confidence = this._module.HEAPF32[ptr / Float32Array.BYTES_PER_ELEMENT];
            ptr += Uint32Array.BYTES_PER_ELEMENT;
            const speakerTag = this._module.HEAP32[ptr / Int32Array.BYTES_PER_ELEMENT];
            ptr += Uint32Array.BYTES_PER_ELEMENT;
            words.push({ word, startSec, endSec, confidence, speakerTag });
          }

          this._module._pv_leopard_transcript_delete(transcriptAddress);
          this._module._pv_leopard_words_delete(wordsAddress);

          return { transcript, words };
        })
        .then((result: LeopardTranscript) => {
          resolve(result);
        })
        .catch((error: any) => {
          reject(error);
        });
    });
  }

  /**
   * Releases resources acquired by WebAssembly module.
   */
  public async release(): Promise<void> {
    if (!this._module) {
      return;
    }
    this._pv_leopard_delete(this._objectAddress);
    this._module._pv_free(this._transcriptAddressAddress);
    this._module._pv_free(this._numWordsAddress);
    this._module._pv_free(this._wordsAddressAddress);
    this._module._pv_free(this._messageStackAddressAddressAddress);
    this._module._pv_free(this._messageStackDepthAddress);
    this._module = undefined;
  }

  private static async initWasm(
    accessKey: string,
    modelPath: string,
    device: string,
    enableAutomaticPunctuation: boolean,
    enableDiarization: boolean,
    wasmBase64: string,
    wasmLibBase64: string,
    createModuleFunc: any,
  ): Promise<any> {
    const blob = new Blob(
      [base64ToUint8Array(wasmLibBase64)],
      { type: 'application/javascript' }
    );
    const module: LeopardModule = await createModuleFunc({
      mainScriptUrlOrBlob: blob,
      wasmBinary: base64ToUint8Array(wasmBase64),
    });

    const pv_leopard_init: pv_leopard_init_type = this.wrapAsyncFunction(
      module,
      "pv_leopard_init",
      6);
    const pv_leopard_process: pv_leopard_process_type = this.wrapAsyncFunction(
      module,
      "pv_leopard_process",
      6);
    const pv_leopard_delete: pv_leopard_delete_type = this.wrapAsyncFunction(
      module,
      "pv_leopard_delete",
      1);

    const transcriptAddressAddress = module._malloc(Int32Array.BYTES_PER_ELEMENT);
    if (transcriptAddressAddress === 0) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }

    const numWordsAddress = module._malloc(Int32Array.BYTES_PER_ELEMENT);
    if (numWordsAddress === 0) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }

    const wordsAddressAddress = module._malloc(Int32Array.BYTES_PER_ELEMENT);
    if (wordsAddressAddress === 0) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }

    const objectAddressAddress = module._malloc(Int32Array.BYTES_PER_ELEMENT);
    if (objectAddressAddress === 0) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }

    const accessKeyAddress = module._malloc((accessKey.length + 1) * Uint8Array.BYTES_PER_ELEMENT);
    if (accessKeyAddress === 0) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }
    for (let i = 0; i < accessKey.length; i++) {
      module.HEAPU8[accessKeyAddress + i] = accessKey.charCodeAt(i);
    }
    module.HEAPU8[accessKeyAddress + accessKey.length] = 0;

    const modelPathEncoded = new TextEncoder().encode(modelPath);
    const modelPathAddress = module._malloc((modelPathEncoded.length + 1) * Uint8Array.BYTES_PER_ELEMENT);
    if (modelPathAddress === 0) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }
    module.HEAPU8.set(modelPathEncoded, modelPathAddress);
    module.HEAPU8[modelPathAddress + modelPathEncoded.length] = 0;

    const deviceAddress = module._malloc((device.length + 1) * Uint8Array.BYTES_PER_ELEMENT);
    if (deviceAddress === 0) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }
    for (let i = 0; i < device.length; i++) {
      module.HEAPU8[deviceAddress + i] = device.charCodeAt(i);
    }
    module.HEAPU8[deviceAddress + device.length] = 0;

    const sdkEncoded = new TextEncoder().encode(this._sdk);
    const sdkAddress = module._malloc((sdkEncoded.length + 1) * Uint8Array.BYTES_PER_ELEMENT);
    if (!sdkAddress) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }
    module.HEAPU8.set(sdkEncoded, sdkAddress);
    module.HEAPU8[sdkAddress + sdkEncoded.length] = 0;
    module._pv_set_sdk(sdkAddress);
    module._pv_free(sdkAddress);
    const messageStackDepthAddress = module._malloc(Int32Array.BYTES_PER_ELEMENT);
    if (!messageStackDepthAddress) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }

    const messageStackAddressAddressAddress = module._malloc(Int32Array.BYTES_PER_ELEMENT);
    if (!messageStackAddressAddressAddress) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }

    const status = await pv_leopard_init(
      accessKeyAddress,
      modelPathAddress,
      deviceAddress,
      enableAutomaticPunctuation ? 1 : 0,
      enableDiarization ? 1 : 0,
      objectAddressAddress
    );
    module._pv_free(accessKeyAddress);
    module._pv_free(modelPathAddress);
    module._pv_free(deviceAddress);
    if (status !== PvStatus.SUCCESS) {
      const messageStack = await Leopard.getMessageStack(
        module._pv_get_error_stack,
        module._pv_free_error_stack,
        messageStackAddressAddressAddress,
        messageStackDepthAddress,
        module.HEAP32,
        module.HEAPU8,
      );

      throw pvStatusToException(status, 'Initialization failed', messageStack);
    }

    const objectAddress = module.HEAP32[objectAddressAddress / Int32Array.BYTES_PER_ELEMENT];
    module._pv_free(objectAddressAddress);

    const sampleRate = module._pv_sample_rate();

    const versionAddress = module._pv_leopard_version();
    const version = arrayBufferToStringAtIndex(
      module.HEAPU8,
      versionAddress
    );

    return {
      module: module,

      pv_leopard_process: pv_leopard_process,
      pv_leopard_delete: pv_leopard_delete,

      version: version,
      sampleRate: sampleRate,

      objectAddress: objectAddress,
      transcriptAddressAddress: transcriptAddressAddress,
      numWordsAddress: numWordsAddress,
      wordsAddressAddress: wordsAddressAddress,
      messageStackAddressAddressAddress: messageStackAddressAddressAddress,
      messageStackDepthAddress: messageStackDepthAddress,
    };
  }

  private static async getMessageStack(
    pv_get_error_stack: pv_get_error_stack_type,
    pv_free_error_stack: pv_free_error_stack_type,
    messageStackAddressAddressAddress: number,
    messageStackDepthAddress: number,
    memoryBufferInt32: Int32Array,
    memoryBufferUint8: Uint8Array
  ): Promise<string[]> {
    const status = pv_get_error_stack(messageStackAddressAddressAddress, messageStackDepthAddress);
    if (status !== PvStatus.SUCCESS) {
      throw new Error(`Unable to get error state: ${status}`);
    }

    const messageStackAddressAddress = memoryBufferInt32[messageStackAddressAddressAddress / Int32Array.BYTES_PER_ELEMENT];

    const messageStackDepth = memoryBufferInt32[messageStackDepthAddress / Int32Array.BYTES_PER_ELEMENT];
    const messageStack: string[] = [];
    for (let i = 0; i < messageStackDepth; i++) {
      const messageStackAddress = memoryBufferInt32[
        (messageStackAddressAddress / Int32Array.BYTES_PER_ELEMENT) + i
      ];
      const message = arrayBufferToStringAtIndex(memoryBufferUint8, messageStackAddress);
      messageStack.push(message);
    }

    pv_free_error_stack(messageStackAddressAddress);

    return messageStack;
  }

  private static wrapAsyncFunction(module: LeopardModule, functionName: string, numArgs: number): (...args: any[]) => any {
    // @ts-ignore
    return module.cwrap(
      functionName,
      "number",
      Array(numArgs).fill("number"),
      { async: true }
    );
  }
}
