# Leopard Binding for React

## Leopard Speech-to-Text Engine

Made in Vancouver, Canada by [Picovoice](https://picovoice.ai)

Leopard is an on-device speech-to-text engine. Leopard is:

- Private; All voice processing runs locally.
- [Accurate](https://picovoice.ai/docs/benchmark/stt/#accuracy)
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

IndexedDB and WebWorkers are required to use `Leopard React`. Browsers without support (i.e. Firefox Incognito Mode) should use the [`LeopardWeb binding`](https://github.com/Picovoice/leopard/tree/master/binding/web) main thread method.

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Installation

Using `yarn`:

```console
yarn add @picovoice/leopard-react
```

or using `npm`:

```console
npm install --save @picovoice/leopard-react
```

## Usage

### Leopard Model

Leopard requires a model file (`.pv`) at initialization. Use one of the default language models found in [lib/common](../../lib/common), or create a custom Leopard model (`.pv`) in the [Picovoice Console](https://console.picovoice.ai/) for the target platform `Web (WASM)`.

There are two methods to initialize Leopard.

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

#### Model Object

Leopard saves and caches your model file in IndexedDB to be used by WebAssembly. Use a different `customWritePath` variable to hold multiple models and set the `forceWrite` value to true to force re-save a model file.
If the model file changes, `version` should be incremented to force the cached models to be updated.
Either `base64` or `publicPath` must be set to instantiate Leopard. If both are set, Leopard will use the `base64` model.

```typescript
const leopardModel = {
  publicPath: ${MODEL_RELATIVE_PATH},
  // or
  base64: ${MODEL_BASE64_STRING},

  // Optionals
  customWritePath: "custom_model",
  forceWrite: true,
  version: 1,
}
```

### Init options

Additional engine options are provided via the `options` parameter. Set `enableAutomaticPunctuation` to true if you wish to enable punctuation in the transcript.

```typescript
// Optional
const options = {
  enableAutomaticPunctuation: true
}
```

### Initialize Leopard

Use `useLeopard` and `init` to initialize `Leopard`:

```typescript
const {
  result,
  sampleRate,
  isLoaded,
  error,
  init,
  process,
  release,
} = useLeopard();

const initLeopard = async () => {
  await init(
    "${ACCESS_KEY}",
    leopardModel,
    options
  )
}
```

In case of any errors, use the `error` state variable to check the error message. Use the `isLoaded` state variable to check if `Leopard` has loaded. 

### Process Audio Frames

The process result is a `result` state variable (object) with:
- `transcript`: A string containing the transcribed data.
- `words`: A list of objects containing a `word`, `startSec`, `endSec`, and `confidence`. Each object indicates the start, end time and confidence (between 0 and 1) of the word.

```typescript
let pcm = new Int16Array();
await process(pcm);

useEffect(() => {
  if (result !== null) {
    console.log(result.transcript);
    console.log(result.words);
  }
}, [result])
```

You may consider transferring the buffer for performance:

```typescript
await process(pcm, {
  transfer: true,
  transferCallback: (data) => { pcm = data }
})
```

### Clean Up

While running in a component, you can call `release` to clean up all resources used by Leopard:

```typescript
release();
```

This will set `isLoaded` and `error` to false.

If any arguments require changes, call `release`, then `init` again to initialize Leopard with the new settings.

You do not need to call `release` when your component is unmounted - the hook will clean up automatically on unmount.

## Non-English Languages

In order to detect non-English wake words you need to use the corresponding model file (`.pv`). The model files for all
supported languages are available [here](https://github.com/Picovoice/leopard/tree/master/lib/common).

## Demo

[//]: # (For example usage refer to our [React demo application]&#40;https://github.com/Picovoice/leopard/tree/master/demo/react&#41;.)
