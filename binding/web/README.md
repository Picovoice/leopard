# Leopard Binding for Web

## Leopard Speech-to-Text Engine

Made in Vancouver, Canada by [Picovoice](https://picovoice.ai)

Leopard is an on-device speech-to-text engine. Leopard is:

- Private; All voice processing runs locally.
- [Accurate](https://picovoice.ai/docs/benchmark/stt/)
- [Compact and Computationally-Efficient](https://github.com/Picovoice/speech-to-text-benchmark#rtf)
- Cross-Platform:
  - Linux (x86_64), macOS (x86_64, arm64), Windows (x86_64)
  - Android and iOS
  - Chrome, Safari, Firefox, and Edge
  - Raspberry Pi (4, 3) and NVIDIA Jetson Nano

## Compatibility

- Chrome / Edge
- Firefox
- Safari

### Restrictions

IndexedDB is required to use `Leopard` in a worker thread. Browsers without IndexedDB support
(i.e. Firefox Incognito Mode) should use `Leopard` in the main thread.

## Installation

Using `yarn`:

```console
yarn add @picovoice/leopard-web
```

or using `npm`:

```console
npm install --save @picovoice/leopard-web
```

### AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

### Usage

Create a model in [Picovoice Console](https://console.picovoice.ai/) or use 
the default models for supported languages found in [lib/common](../../lib/common).

For the web packages, there are two methods to initialize Leopard.

#### Public Directory

**NOTE**: Due to modern browser limitations of using a file URL, this method does __not__ work if used without hosting a server.

This method fetches the model file from the public directory and feeds it to Leopard. Copy the model file into the public directory:

```console
cp ${LEOPARD_MODEL_FILE} ${PATH_TO_PUBLIC_DIRECTORY}
```

#### Base64

**NOTE**: This method works without hosting a server, but increases the size of the model file roughly by 33%.

This method uses a base64 string of the model file and feeds it to Leopard. Use the built-in script `pvbase64` to
base64 your model file:

```console
npx pvbase64 -i ${LEOPARD_MODEL_FILE} -o ${OUTPUT_DIRECTORY}/${MODEL_NAME}.js
```

The output will be a js file which you can import into any file of your project. For detailed information about `pvbase64`,
run:

```console
npx pvbase64 -h
```

#### Leopard Model

Leopard saves and caches your model file in IndexedDB to be used by WebAssembly. Use a different `customWritePath` variable
to hold multiple models and set the `forceWrite` value to true to force re-save a model file.

Either `base64` or `publicPath` must be set to instantiate Leopard. If both are set, Leopard will use the `base64` model.

```typescript
const leopardModel = {
  publicPath: ${MODEL_RELATIVE_PATH},
  // or
  base64: ${MODEL_BASE64_STRING},
  
  // Optionals
  customWritePath: "leopard_model",
  forceWrite: false,
  version: 1,
}
```

#### Init options

Set `enableAutomaticPunctuation` to true, if you wish to enable punctuation in transcript.

```typescript
// Optional, these are default
const options = {
  enableAutomaticPunctuation: true
}
```

#### Initialize Leopard

Create an instance of `Leopard` in the main thread:

```typescript
const handle = await Leopard.create(
  ${ACCESS_KEY},
  leopardModel,
  options // optional options
);
```

Or create an instance of `Leopard` in a worker thread:

```typescript
const handle = await LeopardWorker.create(
  ${ACCESS_KEY},
  leopardModel,
  options // optional options
);
```

#### Process Audio Frames

The process result is an object with:
- `transcript`: A string containing the transcribed data.
- `words`: A list of objects containing a `word`, `startSec`, `endSec`, and `confidence`. Each object indicates the start, end time and confidence (between 0 and 1) of the word.

```typescript
function getAudioData(): Int16Array {
  ... // function to get audio data
  return new Int16Array();
}

const result = await handle.process(getAudioData());
console.log(result.transcript);
console.log(result.words);
```

For processing using worker, you may consider transferring the buffer instead for performance:

```typescript
const pcm = new Int16Array();
const result = await handle.process(pcm, {
  transfer: true,
  transferCallback: (data) => {pcm = data}
});
console.log(result.transcript);
console.log(result.words);
```

#### Clean Up

Clean up used resources by `Leopard` or `LeopardWorker`:

```typescript
await handle.release();
```

#### Terminate

Terminate `LeopardWorker` instance:

```typescript
await handle.terminate();
```

## Demo

For example usage refer to our [Web demo application](https://github.com/Picovoice/leopard/tree/master/demo/web).
