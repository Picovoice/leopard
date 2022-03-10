# Leopard Binding for Flutter

## Leopard Speech-to-Text Engine

Made in Vancouver, Canada by [Picovoice](https://picovoice.ai)

Leopard is an on-device speech-to-text engine. Leopard is:

- Private; All voice processing runs locally.
- Accurate [[1]](https://github.com/Picovoice/speech-to-text-benchmark#results)
- Compact and Computationally-Efficient [[2]](https://github.com/Picovoice/speech-to-text-benchmark#rtf)
- Cross-Platform:
    - Linux (x86_64)
    - macOS (x86_64, arm64)
    - Windows (x86_64)
    - Android
    - iOS
    - Raspberry Pi (4, 3)
    - NVIDIA Jetson Nano

## Compatibility

This binding is for running Leopard on **Flutter 1.20.0+** on the following platforms:

- Android 4.4+ (API 19+)
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

To enable recording with the hardware's microphone, you must first ensure that you have enabled the proper permission on both iOS and Android.

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

Add the Leopard model file to your Flutter application by:

1. Either creating a model in [Picovoice Console](https://console.picovoice.ai/) or using the default model in [/lib/common/leopard_params.pv](/lib/common/leopard_params.pv).
2. Add the model file to an `assets` folder in your project directory.
3. Then add it to your `pubspec.yaml`:
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

An instance of `Leopard` is created by passing a model file path into its static constructor `create`:

```dart
import 'package:leopard_flutter/leopard.dart';

const accessKey = "{ACCESS_KEY}"  // AccessKey obtained from Picovoice Console (https://picovoice.ai/console/)

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
    String transcript = = await _leopard.processFile("${AUDIO_FILE_PATH}");
} on LeopardException catch (err) { }
```

When done resources have to be released explicitly:

```dart
leopard.delete();
```

## Demo App

For example usage refer to our [Flutter demo application](/demo/flutter).
