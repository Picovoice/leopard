# Leopard Binding for React Native

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

This binding is for running Leopard on **React Native 0.62.2+** on the following platforms:

- Android 5.0+ (SDK 21+)
- iOS 10.0+

## Installation

To start install, be sure you have installed yarn and cocoapods. Then, add the following native modules to your react-native project:

```console
yarn add @picovoice/leopard-react-native
```
or
```console
npm i @picovoice/leopard-react-native --save
```

Link the iOS package

```console
cd ios && pod install && cd ..
```

**NOTE**: Due to a limitation in React Native CLI auto-linking, the native module cannot be included as a
transitive dependency. If you are creating a module that depends on leopard-react-native,
you will have to list these as peer dependencies and require developers to install it alongside.

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Adding Leopard Models

Create a custom model using the [Picovoice Console](https://console.picovoice.ai/) or use
the default models for supported languages found in [lib/common](../../lib/common).

### Android

To add a Leopard model file to your Android application, add the file as a bundled resource by placing it under the `assets` directory of your Android application.

### iOS

To add a Leopard model file to your iOS application, add the file as a bundled resource by selecting Build Phases in `Xcode` and adding it to the `Copy Bundle Resources` step.

## Usage

Create an instance of `Leopard`:

```typescript
import { Leopard, LeopardErrors } from '@picovoice/leopard-react-native'

const accessKey = "${ACCESS_KEY}" // AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)
const modelPath = "${LEOPARD_MODEL_PATH}" // path relative to the assets folder or absolute path to file on device

try {
    const leopard = await Leopard.create(accessKey, modelPath)
} catch (err: any) {
  if (err instanceof LeopardErrors) {
    // handle error
  }
}
```

Transcribe an audio file by passing the file path to Leopard:
```typescript
try {
  const { transcript, words } = await leopard.processFile("${AUDIO_FILE_PATH}")
  console.log(transcript)
} catch (err: any) {
  if (err instanceof LeopardErrors) {
    // handle error
  }
}
```

Finally, when done be sure to explicitly release the resources using `leopard.delete()`.

## Demo App

For example usage refer to our [React Native demo application](https://github.com/Picovoice/leopard/tree/master/demo/react-native).
