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

## Installation

The Leopard iOS binding is available via [CocoaPods](https://cocoapods.org/pods/Leopard-iOS). To import it into your iOS project, add the following line to your Podfile: 

```ruby
pod 'Leopard-iOS'
```

## AccessKey

The Leopard SDK requires a valid `AccessKey` at initialization. `AccessKey`s act as your credentials when using Leopard SDKs.
You can create your `AccessKey` for free. Make sure to keep your `AccessKey` secret.

To obtain your `AccessKey`:
1. Login or Signup for a free account on the [Picovoice Console](https://picovoice.ai/console/).
2. Once logged in, go to the [`AccessKey` tab](https://console.picovoice.ai/access_key) to create one or use an existing `AccessKey`.

## Usage

Add the Leopard model file in `Xcode` by:

1. Either creating a model in [Picovoice CAT Console](https://picovoice.ai/cat/) or get the default model in [/lib/common/leopard_params.pv](/lib/common/leopard_params.pv).
2. Add the model as a bundled resource by selecting Build Phases and adding it to Copy Bundle Resources step.

Create an instance of the engine:

```swift
import Leopard

let modelPath = Bundle(for: type(of: self)).path(
        forResource: "${MODEL_FILE}", // Name of the model file name for Leopard
        ofType: "pv")!

let accessKey = "${ACCESS_KEY}" // AccessKey obtained from https://console.picovoice.ai/access_key
let leopard = Leopard(accessKey: accessKey, modelPath: modelPath)
```

Transcribe an audio file either by passing the absolute path or an url to the file:

```swift

do {
    let audioPath = Bundle(for: type(of: self)).path(forResource: "${AUDIO_FILE_NAME}", ofType: "${AUDIO_FILE_EXTENSION}")
    print(leopard.process_file(audioPath))

    let audioURL = Bundle(for: type(of: self)).url(forResource: "${AUDIO_FILE_NAME}", withExtension: "${AUDIO_FILE_EXTENSION}")
    print(leopard.process_file(audioURL))
} catch let error as LeopardError {
    // handle error
} catch { }
```


Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console]((https://console.picovoice.ai/)), `${MODEL_FILE}` 
with the name of the Leopard model file name, `${AUDIO_FILE_NAME}` with the name of the audio file and 
`${AUDIO_FILE_EXTENSION}` with the extension of the audio file. Finally, when done be sure to explicitly release
the resources using `leopard.delete()`.

## Demo App

For example usage refer to our [iOS demo application](/demo/ios).
