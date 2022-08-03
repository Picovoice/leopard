# leopard-web

The Picovoice Leopard library for web browsers, powered by WebAssembly.

This library transcribes audio samples in-browser, offline. All processing is done via WebAssembly and Workers in a separate thread.

Looking for Leopard on NodeJS? See the [@picovoice/leopard-node](https://www.npmjs.com/package/@picovoice/leopard-node) package.

## Compatibility

- Chrome / Edge
- Firefox
- Safari

This library requires several modern browser features: `WebAssembly`, `Web Workers`, `IndexedDB` and `Promise`. Internet Explorer will _not_ work.

## Installation & Usage

### Package

Install the [Leopard-Web package](https://www.npmjs.com/package/@picovoice/leopard-web) using `yarn`:

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

### Leopard Models

Leopard requires a model file on initialization. Create a custom model file from [Picovoice Console](https://console.picovoice.ai/cat)
or you can use the [default model file](/lib/common/leopard_params.pv).

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

### Usage

#### Init options

Leopard saves and caches your model file in IndexedDB to be used by WebAssembly. Use a different `modelPath` variable
to hold multiple models and set the `forceWrite` value to true to force re-save a model file. Set `enableAutomaticPunctuation`
to true, if wish to enable punctuation in transcription.
If the model file (`.pv`) changes, `version` should be incremented to force the cached model to be updated.

```typescript
// these are default
const options = {
  enableAutomaticPunctuation: false,
  modelPath: "leopard_model",
  forceWrite: false,
  version: 1
}
```

#### Initialize in Main Thread

Use `Leopard` to initialize from public directory:

```typescript
const handle = await Leopard.fromPublicDirectory(
  ${ACCESS_KEY},
  ${MODEL_FILE_RELATIVE_TO_PUBLIC_DIRECTORY},
  options // optional options
);
```

or initialize using a base64 string:

```typescript
import leopardParams from "${PATH_TO_BASE64_LEOPARD_PARAMS}";

const handle = await Leopard.fromBase64(
  ${ACCESS_KEY},
  leopardParams,
  options // optional options
)
```

#### Initialize in Worker Thread

Use `LeopardWorker` to initialize from public directory:

```typescript
const handle = await LeopardWorker.fromPublicDirectory(
  ${ACCESS_KEY},
  ${MODEL_FILE_RELATIVE_TO_PUBLIC_DIRECTORY},
  options // optional options
);
```

or initialize using a base64 string:

```typescript
import leopardParams from "${PATH_TO_BASE64_LEOPARD_PARAMS}";

const handle = await LeopardWorker.fromBase64(
  ${ACCESS_KEY},
  leopardParams,
  options // optional options
)
```

#### Process Audio Frames

The process result is an object with:
- `transcription`: A string containing the transcribed data.
- `words`: A list of objects containing a `word`, `startSec`, `endSec`, and `confidence`. Each object indicates the start, end time and confidence (between 0 and 1) of the word.

```typescript
function getAudioData(): Int16Array {
  ... // function to get audio data
  return new Int16Array();
}

const result = await handle.process(getAudioData());
console.log(result.transcription);
console.log(result.words);
```

For processing using worker, you may consider transferring the buffer instead for performance:

```typescript
const pcm = new Int16Array();
const result = await handle.process(pcm, {
  transfer: true,
  transferCB: (data) => {pcm = data}
});
console.log(result.transcription);
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

## Build from source (IIFE + ESM outputs)

This library uses Rollup and TypeScript along with Babel and other popular rollup plugins. There are two outputs: an IIFE version intended for script tags / CDN usage, and a JavaScript module version intended for use with modern JavaScript/TypeScript development (e.g. Angular, Create React App, Webpack).

```console
yarn
yarn build
```

The output will appear in the ./dist/ folder.
