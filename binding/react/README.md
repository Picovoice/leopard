# Leopard Binding for React

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
(i.e. Firefox Incognito Mode) should use the [`LeopardWeb binding`](https://github.com/Picovoice/leopard/tree/master/binding/web) in the main thread.

## Installation

### Package

Using `yarn`:

```console
yarn add @picovoice/leopard-react
```

or using `npm`:

```console
npm install --save @picovoice/leopard-react
```

### AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Usage

Create a model in [Picovoice Console](https://console.picovoice.ai/) or use one of the default language models found in [lib/common](../../lib/common).

There are two methods to initialize Leopard.

### Public Directory

**NOTE**: Due to modern browser limitations of using a file URL, this method does __not__ work if used without hosting a server.

This method fetches the model file from the public directory and feeds it to Leopard. Copy the model file into the public directory:

```console
cp ${LEOPARD_MODEL_FILE} ${PATH_TO_PUBLIC_DIRECTORY}
```

### Base64

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

### Leopard Model

Leopard saves and caches your model file in IndexedDB to be used by WebAssembly. Use a different `customWritePath` variable
to hold multiple models and set the `forceWrite` value to true to force re-save a model file.
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

Set `enableAutomaticPunctuation` to true, if you wish to enable punctuation in transcript.

```typescript
// Optional
const options = {
  enableAutomaticPunctuation: true
}
```

### Initialize Leopard

Use `useLeopard` and `init` to initialize `Leopard`:

```typescript
import { useLeopard } from '@picovoice/leopard-react';

const {
  transcript,
  isLoaded,
  error,
  init,
  process,
  release,
} = useLeopard();

await init(
  ${ACCESS_KEY},
  leopardModel
)
```

In case of any errors, use the `error` state variable to check the error message. Use the `isLoaded` state variable to check if `Leopard` has loaded. 

### Process Audio Frames

The process result is an object with:
- `transcript`: A string containing the transcribed data.
- `words`: A list of objects containing a `word`, `startSec`, `endSec`, and `confidence`. Each object indicates the start, end time and confidence (between 0 and 1) of the word.

```typescript
const pcm = new Int16Array();
await process(pcm);
useEffect(() => {
  if (transcript !== null) {
    console.log(transcript.transcript);
    console.log(transcript.words);
  }
}, [transcript])
```

You may consider transferring the buffer for performance:

```typescript
await process(pcm, {
  transfer: true,
  transferCallback: (data) => { pcm = data }
})
```

### Clean Up

While running in a component, you can call `release` to clean up all resources used by `Leopard`:

```typescript
await release();
```

## Custom Model

Create custom models using the [Picovoice Console](https://console.picovoice.ai/).
Train and download a Leopard model (`.pv`) for the target platform `Web (WASM)`.
This model file can be used directly with `publicPath`, but, if `base64` is preferable, convert the `.pv` file to a base64
JavaScript variable using the built-in `pvbase64` script:

```console
npx pvbase64 -i ${LEOPARD_MODEL_FILE} -o ${OUTPUT_DIRECTORY}/${MODEL_NAME}.js
```

Model files (`.pv`) are saved in IndexedDB to be used by Web Assembly.
Either `base64` or `publicPath` must be set for each keyword to instantiate Leopard.
If both are set, Leopard will use the `base64` model.

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

Then, initialize an instance of `Leopard`:

```typescript
const {
  transcript,
  isLoaded,
  error,
  init,
  process,
  release,
} = useLeopard();

await init(
  ${ACCESS_KEY},
  leopardModel
)
```

## Non-English Languages

In order to detect non-English wake words you need to use the corresponding model file (`.pv`). The model files for all
supported languages are available [here](https://github.com/Picovoice/leopard/tree/master/lib/common).

## Demo

For example usage refer to our [React demo application](https://github.com/Picovoice/leopard/tree/master/demo/react).
