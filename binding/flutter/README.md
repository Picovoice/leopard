# Leopard Binding for Flutter

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

This binding is for running Leopard on **Flutter 2.8.1+** on the following platforms:

- Android 5.0+ (API 21+)
- iOS 13.0+

## Installation

To start, you must have the [Flutter SDK](https://flutter.dev/docs/get-started/install) installed on your system. Once installed, you can run `flutter doctor` to determine any other missing requirements.

To add the Leopard plugin to your app project, you can reference it in your pub.yaml:
```yaml
dependencies:
  leopard_flutter: ^<version>
```

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Permissions

To enable recording with the hardware's microphone, you must first ensure that you have enabled the proper permissions on both iOS and Android.

On iOS, open your Info.plist and add the following line:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>[Permission explanation]</string>
```

On Android, open your AndroidManifest.xml and add the following line:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
```

## Usage

An instance of [`Leopard`](https://picovoice.ai/docs/api/leopard-flutter/#leopard) is created by passing a model file path into its static constructor `create`:

```dart
import 'package:leopard_flutter/leopard.dart';

String accessKey = '{ACCESS_KEY}' // AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)
String modelPath = '{MODEL_FILE_PATH}' // path relative to the assets folder or absolute path to file on device

void createLeopard() async {
    try {
        _leopard = await Leopard.create(accessKey, modelPath);
    } on LeopardException catch (err) {
        // handle Leopard init error
    }
}
```

Transcribe an audio file by passing in the path:

```dart
String audioPath = '{AUDIO_FILE_PATH}'

try {
    LeopardTranscript result = await _leopard.processFile(audioPath);
    print(result.transcript);
} on LeopardException catch (err) { }
```

When done, resources must be released explicitly:

```dart
await _leopard.delete();
```

### Language Model

Add the Leopard model file to your Flutter application:

1. Create a model in [Picovoice Console](https://console.picovoice.ai/) or use one of the [default language models](https://github.com/Picovoice/leopard/tree/master/lib/common).
2. Add the model file to an `assets` folder in your project directory.
3. Add the asset to your `pubspec.yaml`:
```yaml
flutter:
  assets:
    - assets/leopard_model.pv
```
4. In this example, the path to the model file in code would then be as follows:
```dart
String modelPath = "assets/leopard_model.pv";
```

Alternatively, if the model file is deployed to the device with a different method, the absolute path to the file on device can be used.

### Word Metadata

Along with the transcript, Leopard returns metadata for each transcribed word. Available metadata items are:

- **Start Time:** Indicates when the word started in the transcribed audio. Value is in seconds.
- **End Time:** Indicates when the word ended in the transcribed audio. Value is in seconds.
- **Confidence:** Leopard's confidence that the transcribed word is accurate. It is a number within `[0, 1]`.
- **Speaker Tag:** If speaker diarization is enabled on initialization, the speaker tag is a non-negative integer identifying unique speakers, with `0` reservered for unknown speakers. If speaker diarization is not enabled, the value will always be `-1`.

## Demo App

For example usage, refer to our [Flutter demo application](https://github.com/Picovoice/leopard/tree/master/demo/flutter).
