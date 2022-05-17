/* eslint camelcase: 0 */

import { Mutex } from "async-mutex";

import {
  aligned_alloc_type,
  buildWasm,
  arrayBufferToStringAtIndex,
  isAccessKeyValid,
  getPvStorage
} from "@picovoice/web-utils";

/**
 * WebAssembly function types
 */

type pv_leopard_init_type = (accessKey: number, modelPath: number, object: number) => Promise<number>;
type pv_leopard_process_type = (object: number, pcm: number, num_samples: number, transcription: number) => Promise<number>;
type pv_leopard_delete_type = (object: number) => Promise<void>;
type pv_status_to_string_type = (status: number) => Promise<number>
type pv_sample_rate_type = () => Promise<number>;
type pv_leopard_version_type = () => Promise<number>;

/**
* JavaScript/WebAssembly Binding for Leopard
*/

type LeopardWasmOutput = {
  aligned_alloc: CallableFunction;
  memory: WebAssembly.Memory;
  objectAddress: number;
  pvLeopardDelete: pv_leopard_delete_type;
  pvLeopardProcess: pv_leopard_process_type;
  pvStatusToString: pv_status_to_string_type;
  sampleRate: number;
  version: string;
  transcriptionAddressAddress: number;
};

const PV_STATUS_SUCCESS = 10000;

export class Leopard {
  private _pvLeopardDelete: pv_leopard_delete_type;
  private _pvLeopardProcess: pv_leopard_process_type;
  private _pvStatusToString: pv_status_to_string_type;

  private _wasmMemory: WebAssembly.Memory;
  private _memoryBuffer: Int16Array;
  private _memoryBufferUint8: Uint8Array;
  private _memoryBufferView: DataView;
  private _processMutex: Mutex;

  private _objectAddress: number;
  private _alignedAlloc: CallableFunction;
  private _transcriptionAddressAddress: number;

  private static _sampleRate: number;
  private static _version: string;

  private _malloc: CallableFunction;

  private static _leopardMutex = new Mutex();

  private constructor(handleWasm: LeopardWasmOutput) {
    Leopard._sampleRate = handleWasm.sampleRate;
    Leopard._version = handleWasm.version;

    this._pvLeopardDelete = handleWasm.pvLeopardDelete;
    this._pvLeopardProcess = handleWasm.pvLeopardProcess;
    this._pvStatusToString = handleWasm.pvStatusToString;

    this._wasmMemory = handleWasm.memory;
    this._objectAddress = handleWasm.objectAddress;
    this._alignedAlloc = handleWasm.aligned_alloc;
    // @ts-ignore
    this._malloc = handleWasm.malloc;
    this._transcriptionAddressAddress = handleWasm.transcriptionAddressAddress;

    this._memoryBuffer = new Int16Array(handleWasm.memory.buffer);
    this._memoryBufferUint8 = new Uint8Array(handleWasm.memory.buffer);
    this._memoryBufferView = new DataView(handleWasm.memory.buffer);
    this._processMutex = new Mutex();
  }

  /**
   * Releases resources acquired by WebAssembly module.
   */
  public async release(): Promise<void> {
    await this._pvLeopardDelete(this._objectAddress);
  }

  /**
   * Processes a frame of audio. The required sample rate can be retrieved from '.sampleRate' and the length
   * of frame (number of audio samples per frame) can be retrieved from '.frameLength'. The audio needs to be
   * 16-bit linearly-encoded. Furthermore, the engine operates on single-channel audio.
   *
   * @param pcm - A frame of audio with properties described above.
   * @return Probability of voice activity. It is a floating-point number within [0, 1].
   */
  public async process(pcm: Int16Array): Promise<string> {
    if (!(pcm instanceof Int16Array)) {
      throw new Error("The argument 'pcm' must be provided as an Int16Array");
    }



    const inputBufferAddress = await this._alignedAlloc(
      Int16Array.BYTES_PER_ELEMENT,
      pcm.length * Int16Array.BYTES_PER_ELEMENT
    );
    if (inputBufferAddress === 0) {
      throw new Error('malloc failed: Cannot allocate memory');
    }

    const returnPromise = new Promise<string>((resolve, reject) => {
      this._processMutex
      .runExclusive(async () => {
        this._memoryBuffer.set(
          pcm,
          inputBufferAddress / Int16Array.BYTES_PER_ELEMENT
        );

        const status = await this._pvLeopardProcess(
          this._objectAddress,
          inputBufferAddress,
          pcm.length,
          this._transcriptionAddressAddress
        );
        if (status !== PV_STATUS_SUCCESS) {
          const memoryBuffer = new Uint8Array(this._wasmMemory.buffer);
          throw new Error(
            `process failed with status ${arrayBufferToStringAtIndex(
              memoryBuffer,
              await this._pvStatusToString(status)
            )}`
          );
        }
        const transcriptionAddress = this._memoryBufferView.getInt32(
          this._transcriptionAddressAddress,
          true
        );

        const transcription = arrayBufferToStringAtIndex(
          this._memoryBufferUint8,
          transcriptionAddress
        );

        return transcription;
      })
      .then((result: string) => {
        resolve(result);
      })
      .catch((error: any) => {
        reject(error);
      });
    });

    return returnPromise;
  }

  get version(): string {
    return Leopard._version;
  }

  get sampleRate(): number {
    return Leopard._sampleRate;
  }

  /**
   * Creates an instance of the Picovoice Leopard voice activity detection (VAD) engine.
   * Behind the scenes, it requires the WebAssembly code to load and initialize before
   * it can create an instance.
   *
   * @param accessKey - AccessKey
   * generated by Picovoice Console
   *
   * @returns An instance of the Leopard engine.
   */
  public static async create(accessKey: string, wasmBase64: string, model: string): Promise<Leopard> {
    if (!isAccessKeyValid(accessKey)) {
      throw new Error('Invalid AccessKey');
    }
    const returnPromise = new Promise<Leopard>((resolve, reject) => {
      Leopard._leopardMutex
      .runExclusive(async () => {
        const pvStorage = getPvStorage();
        // @ts-ignore
        await pvStorage.setItem("modelPath", model);
        const wasmOutput = await Leopard.initWasm(accessKey.trim(), wasmBase64);
        return new Leopard(wasmOutput);
      })
      .then((result: Leopard) => {
        resolve(result);
      })
      .catch((error: any) => {
        reject(error);
      });
    });
    return returnPromise;
  }

  private static async initWasm(accessKey: string, wasmBase64: string): Promise<any> {
    // A WebAssembly page has a constant size of 64KiB. -> 1MiB ~= 16 pages
    // minimum memory requirements for init: 3 pages
    const memory = new WebAssembly.Memory({ initial: 5484 });

    const memoryBufferUint8 = new Uint8Array(memory.buffer);

    const exports = await buildWasm(memory, wasmBase64);
    console.log(exports)

    const aligned_alloc = exports.aligned_alloc as aligned_alloc_type;
    const pv_leopard_version = exports.pv_leopard_version as pv_leopard_version_type;
    const pv_leopard_process = exports.pv_leopard_process as pv_leopard_process_type;
    const pv_leopard_delete = exports.pv_leopard_delete as pv_leopard_delete_type;
    const pv_leopard_init = exports.pv_leopard_init as pv_leopard_init_type;
    const pv_status_to_string = exports.pv_status_to_string as pv_status_to_string_type;
    const pv_sample_rate = exports.pv_sample_rate as pv_sample_rate_type;

    const transcriptionAddressAddress = await aligned_alloc(
      Uint8Array.BYTES_PER_ELEMENT,
      Uint8Array.BYTES_PER_ELEMENT
    );
    if (transcriptionAddressAddress === 0) {
      throw new Error('malloc failed: Cannot allocate memory');
    }

    const objectAddressAddress = await aligned_alloc(
      Int32Array.BYTES_PER_ELEMENT,
      Int32Array.BYTES_PER_ELEMENT
    );
    if (objectAddressAddress === 0) {
      throw new Error('malloc failed: Cannot allocate memory');
    }

    const accessKeyAddress = await aligned_alloc(
      Uint8Array.BYTES_PER_ELEMENT,
      (accessKey.length + 1) * Uint8Array.BYTES_PER_ELEMENT
    );

    if (accessKeyAddress === 0) {
      throw new Error('malloc failed: Cannot allocate memory');
    }

    for (let i = 0; i < accessKey.length; i++) {
      memoryBufferUint8[accessKeyAddress + i] = accessKey.charCodeAt(i);
    }
    memoryBufferUint8[accessKeyAddress + accessKey.length] = 0;

    const modelPath = "modelPath"
    const modelPathAddress = await aligned_alloc(
      Uint8Array.BYTES_PER_ELEMENT,
      (modelPath.length + 1) * Uint8Array.BYTES_PER_ELEMENT
    );

    if (modelPathAddress === 0) {
      throw new Error('malloc failed: Cannot allocate memory');
    }

    for (let i = 0; i < modelPath.length; i++) {
      memoryBufferUint8[modelPathAddress + i] = modelPath.charCodeAt(i);
    }
    memoryBufferUint8[modelPathAddress + modelPath.length] = 0;

    const status = await pv_leopard_init(accessKeyAddress, modelPathAddress, objectAddressAddress);
    if (status !== PV_STATUS_SUCCESS) {
      throw new Error(
        `'pv_leopard_init' failed with status ${arrayBufferToStringAtIndex(
          memoryBufferUint8,
          await pv_status_to_string(status)
        )}`
      );
    }
    const memoryBufferView = new DataView(memory.buffer);
    const objectAddress = memoryBufferView.getInt32(objectAddressAddress, true);

    const sampleRate = await pv_sample_rate();
    const versionAddress = await pv_leopard_version();
    const version = arrayBufferToStringAtIndex(
      memoryBufferUint8,
      versionAddress
    );

    return {
      malloc: exports.malloc,
      aligned_alloc,
      memory: memory,
      objectAddress: objectAddress,
      pvLeopardDelete: pv_leopard_delete,
      pvLeopardProcess: pv_leopard_process,
      pvStatusToString: pv_status_to_string,
      sampleRate: sampleRate,
      version: version,
      transcriptionAddressAddress: transcriptionAddressAddress,
    };
  }
}

export default Leopard;
