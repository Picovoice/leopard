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
  - Raspberry Pi (3, 4, 5) and NVIDIA Jetson Nano

## Compatibility

- Chrome / Edge
- Firefox
- Safari

### Restrictions

IndexedDB and WebWorkers are required to use `Leopard React`. Browsers without support (e.g. Firefox Incognito Mode) should use the [`LeopardWeb binding`](https://github.com/Picovoice/leopard/tree/master/binding/web) main thread method.

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Installation

Using `yarn`:

```console
yarn add @picovoice/leopard-react @picovoice/web-voice-processor
```

or using `npm`:

```console
npm install --save @picovoice/leopard-react @picovoice/web-voice-processor
```

## Usage

Leopard requires a model file (`.pv`) at initialization. Use one of the default language models found in [lib/common](https://github.com/Picovoice/leopard/tree/master/lib/common), or create a custom Leopard model in the [Picovoice Console](https://console.picovoice.ai/) for the target platform `Web (WASM)`.

There are two methods to initialize Leopard.

### Public Directory

**NOTE**: Due to modern browser limitations of using a file URL, this method does __not__ work if used without hosting a server.

This method fetches the model file from the public directory and feeds it to Leopard. Copy the model file into the public directory:

```console
cp ${LEOPARD_MODEL_FILE} ${PATH_TO_PUBLIC_DIRECTORY}
```

### Base64

**NOTE**: This method works without hosting a server, but increases the size of the model file roughly by 33%.

This method uses a base64 string of the model file and feeds it to Leopard. Use the built-in script `pvbase64` to base64 your model file:

```console
npx pvbase64 -i ${LEOPARD_MODEL_FILE} -o ${OUTPUT_DIRECTORY}/${MODEL_NAME}.js
```

The output will be a js file which you can import into any file of your project. For detailed information about `pvbase64`,
run:

```console
npx pvbase64 -h
```

### Leopard Model

Leopard saves and caches your model file in IndexedDB to be used by WebAssembly. Use a different `customWritePath` variable to hold multiple models and set the `forceWrite` value to true to force re-save a model file.
If the model file changes, `version` should be incremented to force the cached models to be updated.
Either `base64` or `publicPath` must be set to instantiate Leopard. If both are set, Leopard will use the `base64` model.

```typescript
const leopardModel = {
  publicPath: "${MODEL_RELATIVE_PATH}",
  // or
  base64: "${MODEL_BASE64_STRING}",

  // Optionals
  customWritePath: "custom_model",
  forceWrite: true,
  version: 1,
}
```

Additional engine options are provided via the `options` parameter. Set `enableAutomaticPunctuation` to true if you wish to enable punctuation in the transcript or `enableDiarization` to true if you wish to enable speaker diarization.

```typescript
// Optional
const options = {
  enableAutomaticPunctuation: true,
  enableDiarization: true
}
```

### Initialize Leopard

Use `useLeopard` and `init` to initialize `Leopard`:

```typescript
const {
  result,
  isLoaded,
  error,
  init,
  processFile,
  startRecording,
  stopRecording,
  isRecording,
  recordingElapsedSec,
  release,
} = useLeopard();

const initLeopard = async () => {
  await init(
    "${ACCESS_KEY}",
    leopardModel,
    options,
  );
}
```

In case of any errors, use the `error` state variable to check the error message. Use the `isLoaded` state variable to check if `Leopard` has loaded.

### Transcribe Audio

The audio that you want to transcribe can either be uploaded as a `File` object or recorded with a microphone.

#### File Object

Transcribe File objects directly using the `processFile` function:

```typescript jsx
<input
  type="file"
  accept="audio/*"
  onChange={async (e) => {
    if (!!e.target.files?.length) {
      await processFile(e.target.files[0]);
    }
  }}
/>
```

Once the audio has been processed, the transcript will be available in the [`result`](#result) state variable.

#### Record Audio

Leopard React binding uses [WebVoiceProcessor](https://github.com/Picovoice/web-voice-processor) to record audio. To start recording audio, call `startRecording`:

```typescript
await startRecording();
```

If `WebVoiceProcessor` has started correctly, `isRecording` will be set to true.

**Note**: By default, Leopard will only record for 2 minutes before stopping and processing the buffered audio. This is to prevent unbounded memory usage. To increase this limit, call `startRecording` with the optional `maxRecordingSec` parameter:

```typescript
const maxRecordingSec = 60 * 10
await startRecording(maxRecordingSec)
```

Call `stopRecording` to stop recording audio:

```typescript
await stopRecording();
```

If `WebVoiceProcessor` has stopped correctly, `isRecording` will be set to false. Once stopped, audio processing will automatically begin. Once completed, the transcript will be available in [`result`](#result).

#### Result

Once audio has been processed, the transcript will be available in the `result` state variable:

```typescript
useEffect(() => {
  if (result !== null) {
    console.log(result.transcript);
    console.log(result.words);
  }
}, [result])
```

Along with the transcript, Leopard returns metadata for each transcribed word. Available metadata items are:

- **Start Time:** Indicates when the word started in the transcribed audio. Value is in seconds.
- **End Time:** Indicates when the word ended in the transcribed audio. Value is in seconds.
- **Confidence:** Leopard's confidence that the transcribed word is accurate. It is a number within `[0, 1]`.
- **Speaker Tag:** If speaker diarization is enabled on initialization, the speaker tag is a non-negative integer identifying unique speakers, with `0` reserved for unknown speakers. If speaker diarization is not enabled, the value will always be `-1`.

### Release

While running in a component, you can call `release` to clean up all resources used by Leopard and WebVoiceProcessor:

```typescript
await release();
```

This will set `isLoaded` and `isRecording` to false, `recordingElapsedSec` to 0, and `error` to null.

If any arguments require changes, call `release`, then `init` again to initialize Leopard with the new settings.

You do not need to call `release` when your component is unmounted - the hook will clean up automatically on unmount.

## Non-English Languages

In order to transcribe non-English audio files and recordings you need to use the corresponding model file (`.pv`). The model files for all supported languages are available [here](https://github.com/Picovoice/leopard/tree/master/lib/common).

## Demo

For example usage refer to our [React demo application](https://github.com/Picovoice/leopard/tree/master/demo/react).
