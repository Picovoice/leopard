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
  - Raspberry Pi (3, 4, 5)

## Compatibility

- iOS 16.0+

## Installation

<!-- markdown-link-check-disable -->
The Leopard iOS binding is available via [Swift Package Manager](https://www.swift.org/documentation/package-manager/) or [CocoaPods](https://cocoapods.org/pods/Leopard-iOS).
<!-- markdown-link-check-enable -->

To import the package using SPM, open up your project's Package Dependencies in XCode and add:
```
https://github.com/Picovoice/leopard.git
```
To import it into your iOS project using CocoaPods, add the following line to your Podfile:

```ruby
pod 'Leopard-iOS'
```

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Usage

Add the Leopard model file in `Xcode`:

1. Create a model in [Picovoice Console](https://console.picovoice.ai/) or use a [default model](../../lib/common/).
2. Add the model as a bundled resource by selecting Build Phases and adding it to `Copy Bundle Resources` step.

Create an instance of the engine:

```swift
import Leopard

let modelPath = Bundle(for: type(of: self)).path(
        forResource: "${MODEL_FILE}", // Name of the model file name for Leopard
        ofType: "pv")!

let accessKey = "${ACCESS_KEY}" // AccessKey obtained from https://console.picovoice.ai/access_key
let leopard = Leopard(accessKey: accessKey, modelPath: modelPath)
```

Alternatively, you can provide `modelPath` as an absolute path to the model file on device.

Transcribe an audio file either by passing the absolute path or an url to the file:

```swift

do {
    let audioPath = Bundle(for: type(of: self)).path(forResource: "${AUDIO_FILE_NAME}", ofType: "${AUDIO_FILE_EXTENSION}")
    var result = leopard.process_file(audioPath)
    print(result.transcript)

    let audioURL = Bundle(for: type(of: self)).url(forResource: "${AUDIO_FILE_NAME}", withExtension: "${AUDIO_FILE_EXTENSION}")
    result = leopard.process_file(audioURL)
    print(result.transcript)
} catch let error as LeopardError {
    // handle error
} catch { }
```


Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console](https://console.picovoice.ai/), `${MODEL_FILE}`
with the name of the Leopard model file name, `${AUDIO_FILE_NAME}` with the name of the audio file and
`${AUDIO_FILE_EXTENSION}` with the extension of the audio file. Finally, when done be sure to explicitly release
the resources using `leopard.delete()`.

### Language Model

Default models for supported languages can be found in [lib/common](../../lib/common).

Create custom language models using the [Picovoice Console](https://console.picovoice.ai/). Here you can train
language models with custom vocabulary and boost words in the existing vocabulary.

Pass in the `.pv` file via the `modelURL` or `modelPath` constructor argument:
```swift
let leopard = Leopard(accessKey: accessKey, modelPath: "${MODEL_FILE_PATH")
// or
let leopard = Leopard(accessKey: accessKey, modelURL: "${MODEL_FILE_URL}")
```

### Word Metadata

Along with the transcript, Leopard returns metadata for each transcribed word. Available metadata items are:

- **Start Time:** Indicates when the word started in the transcribed audio. Value is in seconds.
- **End Time:** Indicates when the word ended in the transcribed audio. Value is in seconds.
- **Confidence:** Leopard's confidence that the transcribed word is accurate. It is a number within `[0, 1]`.
- **Speaker Tag:** If speaker diarization is enabled on initialization, the speaker tag is a non-negative integer identifying unique speakers, with `0` reserved for unknown speakers. If speaker diarization is not enabled, the value will always be `-1`.

## Running Unit Tests

Copy your `AccessKey` into the `accessKey` variable in [`LeopardAppTestUITests.swift`](LeopardAppTest/LeopardAppTestUITests/LeopardAppTestUITests.swift). Open [`LeopardAppTest.xcodeproj`](LeopardAppTest/LeopardAppTest.xcodeproj) with XCode and run the tests with `Product > Test`.

## Demo App

For example usage refer to our [iOS demo application](../../demo/ios).
