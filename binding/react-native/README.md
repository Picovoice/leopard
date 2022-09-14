# Leopard Binding for iOS

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

## Adding custom Leopard models

Create a custom model using the [Picovoice Console](https://console.picovoice.ai/) or use the [default model](https://github.com/Picovoice/leopard/tree/master/lib/common/).

### Android

To add a Leopard model file to your Android application, add the file as a bundled resource by placing it under the `assets` directory of your Android application.

### iOS

To add a Leopard model file to your iOS application, add the file as a bundled resource by selecting Build Phases in `Xcode` and adding it to the `Copy Bundle Resources` step.

## Usage

Transcribe an audio file either by passing the absolute path or an url to the file:

```typescript
import { Leopard, LeopardErrors } from '@picovoice/leopard-react-native';

const getAudioFrame = () => {
  // get audio frames
}

try {
  const leopard = await Leopard.create("${ACCESS_KEY}", "${MODEL_FILE}")

  const { transcript, words } = await leopard.processFile("${AUDIO_FILE_PATH}")
  console.log(transcript)
} catch (err: any) {
  if (err instanceof LeopardErrors) {
    // handle error
  }
}
```

Replace `${ACCESS_KEY}` with your `AccessKey` obtained from [Picovoice Console](https://console.picovoice.ai/), `${MODEL_FILE}`
with the name of the Leopard model file name and `${AUDIO_FILE_PATH}` with the absolute path of the audio file.
Finally, when done be sure to explicitly release the resources using `leopard.delete()`.

## Demo App

For example usage refer to our [React Native demo application](https://github.com/Picovoice/leopard/tree/master/demo/react-native).
