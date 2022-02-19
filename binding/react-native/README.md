# Leopard Binding for iOS

## Leopard Speech-to-Text Engine

Made in Vancouver, Canada by [Picovoice](https://picovoice.ai)

Leopard is an on-device speech-to-text engine. Leopard is:

- Private; All voice processing runs locally.
- Accurate [[1]](https://github.com/Picovoice/speech-to-text-benchmark#results)
- Compact and Computationally-Efficient [[1]](https://github.com/Picovoice/speech-to-text-benchmark#results)
- Cross-Platform:
  - Linux (x86_64)
  - macOS (x86_64, arm64)
  - Windows (x86_64)
  - Android
  - iOS
  - Raspberry Pi (4, 3)
  - NVIDIA Jetson Nano

## Compatibility

This binding is for running Leopard on **React Native 0.62.2+** on the following platforms:

- Android 5.0+ (SDK 21+)
- iOS 10.0+

## Installation

To start install be sure you have installed yarn and cocoapods. Then add these two native modules to your react-native project.

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

The Leopard SDK requires a valid `AccessKey` at initialization. `AccessKey`s act as your credentials when using Leopard SDKs.
You can create your `AccessKey` for free. Make sure to keep your `AccessKey` secret.

To obtain your `AccessKey`:
1. Login or Signup for a free account on the [Picovoice Console](https://picovoice.ai/console/).
2. Once logged in, go to the [`AccessKey` tab](https://console.picovoice.ai/access_key) to create one or use an existing `AccessKey`.

## Adding custom Leopard models

### Android

Add the Leopard model file to your Android application by:

1. Either creating a model in [Picovoice Console](https://console.picovoice.ai/) or get the default model in [/lib/common/leopard_params.pv](/lib/common/leopard_params.pv).
2. Add the model as a bundled resource by placing it under the [`assets`](./android/src/main/assets/) directory of your Android application.

### iOS

Open [`Leopard.xcodeproj`](./ios/Leopard.xcodeproj) in `Xcode` and add the Leopard model file in `Xcode` by:

1. Either creating a model in [Picovoice CAT Console](https://picovoice.ai/cat/) or get the default model in [/lib/common/leopard_params.pv](/lib/common/leopard_params.pv).
2. Add the model as a bundled resource by selecting Build Phases and adding it to Copy Bundle Resources step.

## Usage

Transcribe an audio file either by passing the absolute path or an url to the file:

```typescript
import {Leopard, LeopardErrors} from '@picovoice/leopard-react-native';

const getAudioFrame = () => {
  // get audio frames
}

try {
  const leopard = await Leopard.create("${ACCESS_KEY}", "${MODEL_FILE}")
  console.log(await leopard.process(getAudioFrame()))

  console.log(await leopard.processFile("${AUDIO_FILE_NAME}"))
} catch (err: any) {
  if (err instanceof LeopardErrors) {
    // handle error
  }
}
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console]((https://console.picovoice.ai/)), `${MODEL_FILE}`
with the name of the Leopard model file name and `${AUDIO_FILE_NAME}` with the name of the audio file.
Finally, when done be sure to explicitly release the resources using `leopard.delete()`.

## Demo App

For example usage refer to our [React Native demo application](/demo/react-native).
