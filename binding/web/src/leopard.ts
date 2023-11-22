/*
  Copyright 2022-2023 Picovoice Inc.

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
  aligned_alloc_type,
  pv_free_type,
  buildWasm,
  arrayBufferToStringAtIndex,
  isAccessKeyValid,
  loadModel,
  PvError,
} from '@picovoice/web-utils';

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
type pv_leopard_delete_type = (object: number) => Promise<void>;
type pv_leopard_transcript_delete_type = (transcript: number) => Promise<void>;
type pv_leopard_words_delete_type = (words: number) => Promise<void>;
type pv_status_to_string_type = (status: number) => Promise<number>;
type pv_sample_rate_type = () => Promise<number>;
type pv_leopard_version_type = () => Promise<number>;
type pv_set_sdk_type = (sdk: number) => Promise<void>;
type pv_get_error_stack_type = (
  messageStack: number,
  messageStackDepth: number
) => Promise<number>;
type pv_free_error_stack_type = (messageStack: number) => Promise<void>;

/**
 * JavaScript/WebAssembly Binding for Leopard
 */

type LeopardWasmOutput = {
  aligned_alloc: aligned_alloc_type;
  memory: WebAssembly.Memory;
  pvFree: pv_free_type;

  objectAddress: number;
  transcriptAddressAddress: number;
  numWordsAddress: number;
  wordsAddressAddress: number;
  messageStackAddressAddressAddress: number;
  messageStackDepthAddress: number;

  pvLeopardDelete: pv_leopard_delete_type;
  pvLeopardTranscriptDelete: pv_leopard_transcript_delete_type;
  pvLeopardWordsDelete: pv_leopard_words_delete_type;
  pvLeopardProcess: pv_leopard_process_type;
  pvStatusToString: pv_status_to_string_type;
  pvGetErrorStack: pv_get_error_stack_type;
  pvFreeErrorStack: pv_free_error_stack_type;

  sampleRate: number;
  version: string;
  pvError: PvError;
};

const MAX_PCM_LENGTH_SEC = 60 * 15;

export class Leopard {
  private readonly _pvLeopardDelete: pv_leopard_delete_type;
  private readonly _pvLeopardTranscriptDelete: pv_leopard_transcript_delete_type;
  private readonly _pvLeopardWordsDelete: pv_leopard_words_delete_type;
  private readonly _pvLeopardProcess: pv_leopard_process_type;
  private readonly _pvGetErrorStack: pv_get_error_stack_type;
  private readonly _pvFreeErrorStack: pv_free_error_stack_type;

  private _wasmMemory?: WebAssembly.Memory;
  private readonly _pvFree: pv_free_type;
  private readonly _processMutex: Mutex;

  private readonly _objectAddress: number;
  private readonly _alignedAlloc: CallableFunction;
  private readonly _transcriptAddressAddress: number;
  private readonly _numWordsAddress: number;
  private readonly _wordsAddressAddress: number;
  private readonly _messageStackAddressAddressAddress: number;
  private readonly _messageStackDepthAddress: number;

  private static _sampleRate: number;
  private static _version: string;
  private static _wasm: string;
  private static _wasmSimd: string;
  private static _sdk: string = 'web';

  private static _leopardMutex = new Mutex();

  private constructor(handleWasm: LeopardWasmOutput) {
    Leopard._sampleRate = handleWasm.sampleRate;
    Leopard._version = handleWasm.version;

    this._pvLeopardDelete = handleWasm.pvLeopardDelete;
    this._pvLeopardProcess = handleWasm.pvLeopardProcess;
    this._pvLeopardTranscriptDelete = handleWasm.pvLeopardTranscriptDelete;
    this._pvLeopardWordsDelete = handleWasm.pvLeopardWordsDelete;
    this._pvGetErrorStack = handleWasm.pvGetErrorStack;
    this._pvFreeErrorStack = handleWasm.pvFreeErrorStack;

    this._wasmMemory = handleWasm.memory;
    this._pvFree = handleWasm.pvFree;
    this._objectAddress = handleWasm.objectAddress;
    this._alignedAlloc = handleWasm.aligned_alloc;
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
    return Leopard._version;
  }

  /**
   * Get sample rate.
   */
  get sampleRate(): number {
    return Leopard._sampleRate;
  }

  /**
   * Set base64 wasm file.
   * @param wasm Base64'd wasm file to use to initialize wasm.
   */
  public static setWasm(wasm: string): void {
    if (this._wasm === undefined) {
      this._wasm = wasm;
    }
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

  public static _init(
    accessKey: string,
    modelPath: string,
    options: LeopardOptions = {}
  ): Promise<Leopard> {
    if (!isAccessKeyValid(accessKey)) {
      throw new LeopardErrors.LeopardInvalidArgumentError('Invalid AccessKey');
    }

    return new Promise<Leopard>((resolve, reject) => {
      Leopard._leopardMutex
        .runExclusive(async () => {
          const isSimd = await simd();
          const wasmOutput = await Leopard.initWasm(
            accessKey.trim(),
            isSimd ? this._wasmSimd : this._wasm,
            modelPath,
            options
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

    const maxSize = MAX_PCM_LENGTH_SEC * Leopard._sampleRate;
    if (pcm.length > maxSize) {
      throw new LeopardErrors.LeopardInvalidArgumentError(
        `'pcm' size must be smaller than ${maxSize}`
      );
    }

    return new Promise<LeopardTranscript>((resolve, reject) => {
      this._processMutex
        .runExclusive(async () => {
          if (this._wasmMemory === undefined) {
            throw new LeopardErrors.LeopardInvalidStateError(
              'Attempted to call Leopard process after release.'
            );
          }

          const inputBufferAddress = await this._alignedAlloc(
            Int16Array.BYTES_PER_ELEMENT,
            pcm.length * Int16Array.BYTES_PER_ELEMENT
          );
          if (inputBufferAddress === 0) {
            throw new LeopardErrors.LeopardOutOfMemoryError(
              'malloc failed: Cannot allocate memory'
            );
          }

          const memoryBuffer = new Int16Array(this._wasmMemory.buffer);

          memoryBuffer.set(
            pcm,
            inputBufferAddress / Int16Array.BYTES_PER_ELEMENT
          );
          const status = await this._pvLeopardProcess(
            this._objectAddress,
            inputBufferAddress,
            pcm.length,
            this._transcriptAddressAddress,
            this._numWordsAddress,
            this._wordsAddressAddress
          );
          await this._pvFree(inputBufferAddress);

          const memoryBufferUint8 = new Uint8Array(this._wasmMemory.buffer);
          const memoryBufferView = new DataView(this._wasmMemory.buffer);

          if (status !== PvStatus.SUCCESS) {
            const messageStack = await Leopard.getMessageStack(
              this._pvGetErrorStack,
              this._pvFreeErrorStack,
              this._messageStackAddressAddressAddress,
              this._messageStackDepthAddress,
              memoryBufferView,
              memoryBufferUint8
            );

            throw pvStatusToException(status, 'Process failed', messageStack);
          }

          const transcriptAddress = memoryBufferView.getInt32(
            this._transcriptAddressAddress,
            true
          );

          const transcript = arrayBufferToStringAtIndex(
            memoryBufferUint8,
            transcriptAddress
          );

          const numWords = memoryBufferView.getInt32(
            this._numWordsAddress,
            true
          );
          const wordsAddress = memoryBufferView.getInt32(
            this._wordsAddressAddress,
            true
          );

          let ptr = wordsAddress;
          const words: LeopardWord[] = [];
          for (let i = 0; i < numWords; i++) {
            const wordAddress = memoryBufferView.getInt32(ptr, true);
            const word = arrayBufferToStringAtIndex(
              memoryBufferUint8,
              wordAddress
            );
            ptr += Uint32Array.BYTES_PER_ELEMENT;
            const startSec = memoryBufferView.getFloat32(ptr, true);
            ptr += Uint32Array.BYTES_PER_ELEMENT;
            const endSec = memoryBufferView.getFloat32(ptr, true);
            ptr += Uint32Array.BYTES_PER_ELEMENT;
            const confidence = memoryBufferView.getFloat32(ptr, true);
            ptr += Uint32Array.BYTES_PER_ELEMENT;
            const speakerTag = memoryBufferView.getInt32(ptr, true);
            ptr += Uint32Array.BYTES_PER_ELEMENT;
            words.push({ word, startSec, endSec, confidence, speakerTag });
          }

          await this._pvLeopardTranscriptDelete(transcriptAddress);
          await this._pvLeopardWordsDelete(wordsAddress);

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
    await this._pvLeopardDelete(this._objectAddress);
    await this._pvFree(this._transcriptAddressAddress);
    await this._pvFree(this._numWordsAddress);
    await this._pvFree(this._wordsAddressAddress);
    await this._pvFree(this._messageStackAddressAddressAddress);
    await this._pvFree(this._messageStackDepthAddress);
    delete this._wasmMemory;
    this._wasmMemory = undefined;
  }

  private static async initWasm(
    accessKey: string,
    wasmBase64: string,
    modelPath: string,
    options: LeopardOptions
  ): Promise<any> {
    const { enableAutomaticPunctuation = false, enableDiarization = false } =
      options;

    // A WebAssembly page has a constant size of 64KiB. -> 1MiB ~= 16 pages
    const memory = new WebAssembly.Memory({ initial: 11500 });

    const memoryBufferUint8 = new Uint8Array(memory.buffer);

    const pvError = new PvError();

    const exports = await buildWasm(memory, wasmBase64, pvError);
    const aligned_alloc = exports.aligned_alloc as aligned_alloc_type;
    const pv_free = exports.pv_free as pv_free_type;
    const pv_leopard_version =
      exports.pv_leopard_version as pv_leopard_version_type;
    const pv_leopard_process =
      exports.pv_leopard_process as pv_leopard_process_type;
    const pv_leopard_delete =
      exports.pv_leopard_delete as pv_leopard_delete_type;
    const pv_leopard_transcript_delete =
      exports.pv_leopard_transcript_delete as pv_leopard_transcript_delete_type;
    const pv_leopard_words_delete =
      exports.pv_leopard_words_delete as pv_leopard_words_delete_type;
    const pv_leopard_init = exports.pv_leopard_init as pv_leopard_init_type;
    const pv_sample_rate = exports.pv_sample_rate as pv_sample_rate_type;
    const pv_set_sdk = exports.pv_set_sdk as pv_set_sdk_type;
    const pv_get_error_stack =
      exports.pv_get_error_stack as pv_get_error_stack_type;
    const pv_free_error_stack =
      exports.pv_free_error_stack as pv_free_error_stack_type;

    const transcriptAddressAddress = await aligned_alloc(
      Int32Array.BYTES_PER_ELEMENT,
      Int32Array.BYTES_PER_ELEMENT
    );
    if (transcriptAddressAddress === 0) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }

    const numWordsAddress = await aligned_alloc(
      Int32Array.BYTES_PER_ELEMENT,
      Int32Array.BYTES_PER_ELEMENT
    );
    if (numWordsAddress === 0) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }

    const wordsAddressAddress = await aligned_alloc(
      Int32Array.BYTES_PER_ELEMENT,
      Int32Array.BYTES_PER_ELEMENT
    );
    if (wordsAddressAddress === 0) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }

    const objectAddressAddress = await aligned_alloc(
      Int32Array.BYTES_PER_ELEMENT,
      Int32Array.BYTES_PER_ELEMENT
    );
    if (objectAddressAddress === 0) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }

    const accessKeyAddress = await aligned_alloc(
      Uint8Array.BYTES_PER_ELEMENT,
      (accessKey.length + 1) * Uint8Array.BYTES_PER_ELEMENT
    );

    if (accessKeyAddress === 0) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }

    for (let i = 0; i < accessKey.length; i++) {
      memoryBufferUint8[accessKeyAddress + i] = accessKey.charCodeAt(i);
    }
    memoryBufferUint8[accessKeyAddress + accessKey.length] = 0;

    const modelPathEncoded = new TextEncoder().encode(modelPath);
    const modelPathAddress = await aligned_alloc(
      Uint8Array.BYTES_PER_ELEMENT,
      (modelPathEncoded.length + 1) * Uint8Array.BYTES_PER_ELEMENT
    );

    if (modelPathAddress === 0) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }

    memoryBufferUint8.set(modelPathEncoded, modelPathAddress);
    memoryBufferUint8[modelPathAddress + modelPathEncoded.length] = 0;

    const sdkEncoded = new TextEncoder().encode(this._sdk);
    const sdkAddress = await aligned_alloc(
      Uint8Array.BYTES_PER_ELEMENT,
      (sdkEncoded.length + 1) * Uint8Array.BYTES_PER_ELEMENT
    );
    if (!sdkAddress) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }
    memoryBufferUint8.set(sdkEncoded, sdkAddress);
    memoryBufferUint8[sdkAddress + sdkEncoded.length] = 0;
    await pv_set_sdk(sdkAddress);
    await pv_free(sdkAddress);

    const messageStackDepthAddress = await aligned_alloc(
      Int32Array.BYTES_PER_ELEMENT,
      Int32Array.BYTES_PER_ELEMENT
    );
    if (!messageStackDepthAddress) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }

    const messageStackAddressAddressAddress = await aligned_alloc(
      Int32Array.BYTES_PER_ELEMENT,
      Int32Array.BYTES_PER_ELEMENT
    );
    if (!messageStackAddressAddressAddress) {
      throw new LeopardErrors.LeopardOutOfMemoryError(
        'malloc failed: Cannot allocate memory'
      );
    }

    const memoryBufferView = new DataView(memory.buffer);

    const status = await pv_leopard_init(
      accessKeyAddress,
      modelPathAddress,
      enableAutomaticPunctuation ? 1 : 0,
      enableDiarization ? 1 : 0,
      objectAddressAddress
    );
    await pv_free(accessKeyAddress);
    await pv_free(modelPathAddress);
    if (status !== PvStatus.SUCCESS) {
      const messageStack = await Leopard.getMessageStack(
        pv_get_error_stack,
        pv_free_error_stack,
        messageStackAddressAddressAddress,
        messageStackDepthAddress,
        memoryBufferView,
        memoryBufferUint8
      );

      throw pvStatusToException(
        status,
        'Initialization failed',
        messageStack,
        pvError
      );
    }
    const objectAddress = memoryBufferView.getInt32(objectAddressAddress, true);

    const sampleRate = await pv_sample_rate();
    const versionAddress = await pv_leopard_version();
    const version = arrayBufferToStringAtIndex(
      memoryBufferUint8,
      versionAddress
    );

    return {
      aligned_alloc,
      memory: memory,
      pvFree: pv_free,

      objectAddress: objectAddress,
      transcriptAddressAddress: transcriptAddressAddress,
      numWordsAddress: numWordsAddress,
      wordsAddressAddress: wordsAddressAddress,
      messageStackAddressAddressAddress: messageStackAddressAddressAddress,
      messageStackDepthAddress: messageStackDepthAddress,

      pvLeopardDelete: pv_leopard_delete,
      pvLeopardTranscriptDelete: pv_leopard_transcript_delete,
      pvLeopardWordsDelete: pv_leopard_words_delete,
      pvLeopardProcess: pv_leopard_process,
      pvGetErrorStack: pv_get_error_stack,
      pvFreeErrorStack: pv_free_error_stack,

      sampleRate: sampleRate,
      version: version,
      pvError: pvError,
    };
  }

  private static async getMessageStack(
    pv_get_error_stack: pv_get_error_stack_type,
    pv_free_error_stack: pv_free_error_stack_type,
    messageStackAddressAddressAddress: number,
    messageStackDepthAddress: number,
    memoryBufferView: DataView,
    memoryBufferUint8: Uint8Array
  ): Promise<string[]> {
    const status = await pv_get_error_stack(
      messageStackAddressAddressAddress,
      messageStackDepthAddress
    );
    if (status !== PvStatus.SUCCESS) {
      throw pvStatusToException(status, 'Unable to get Leopard error state');
    }

    const messageStackAddressAddress = memoryBufferView.getInt32(
      messageStackAddressAddressAddress,
      true
    );

    const messageStackDepth = memoryBufferView.getInt32(
      messageStackDepthAddress,
      true
    );
    const messageStack: string[] = [];
    for (let i = 0; i < messageStackDepth; i++) {
      const messageStackAddress = memoryBufferView.getInt32(
        messageStackAddressAddress + i * Int32Array.BYTES_PER_ELEMENT,
        true
      );
      const message = arrayBufferToStringAtIndex(
        memoryBufferUint8,
        messageStackAddress
      );
      messageStack.push(message);
    }

    await pv_free_error_stack(messageStackAddressAddress);

    return messageStack;
  }
}
