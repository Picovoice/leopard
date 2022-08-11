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
- iOS 9.0+

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

## Leopard Model File Integration

Add the Leopard model file to your Flutter application:

1. Create a model in [Picovoice Console](https://console.picovoice.ai/) or use the [default model](https://github.com/Picovoice/leopard/tree/master/lib/common).
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

## Usage

An instance of [`Leopard`](https://picovoice.ai/docs/api/leopard-flutter/#leopard) is created by passing a model file path into its static constructor `create`:

```dart
import 'package:leopard_flutter/leopard.dart';

const accessKey = "{ACCESS_KEY}"  // AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)

void createLeopard() async {
    try {
        _leopard = await Leopard.create(accessKey, '{LEOPARD_MODEL_PATH}');
    } on LeopardException catch (err) {
        // handle Leopard init error
    }
}
```

Transcribe an audio file by passing in the path:

```dart
try {
    LeopardTranscript result = await _leopard.processFile("${AUDIO_FILE_PATH}");
    print(result.transcript);
} on LeopardException catch (err) { }
```

When done, resources have to be released explicitly:

```dart
leopard.delete();
```

## Demo App

For example usage, refer to our [Flutter demo application](https://github.com/Picovoice/leopard/tree/master/demo/flutter).
