# Leopard Binding for Android

## Leopard Speech-to-Text Engine

Made in Vancouver, Canada by [Picovoice](https://picovoice.ai)

Leopard is an on-device speech-to-text engine. Leopard is:

- Private; All voice processing runs locally.
- Accurate [[1]](https://github.com/Picovoice/speech-to-text-benchmark#results)
- Compact and Computationally-Efficient [[2]](https://github.com/Picovoice/speech-to-text-benchmark#results)
- Cross-Platform:
    - Linux (x86_64)
    - macOS (x86_64, arm64)
    - Windows (x86_64)
    - Android
    - iOS
    - Raspberry Pi (4, 3)
    - NVIDIA Jetson Nano

## Compatibility

- Android 5.0 (SDK 21+)

## Installation

Leopard is hosted on Maven Central. To include the package in your Android project, ensure you have
included `mavenCentral()` in your top-level `build.gradle` file and then add the following to your
app's `build.gradle`:

```groovy
dependencies {
    // ...
    implementation 'ai.picovoice:leopard-android:${VERSION}'
}
```

## Usage

Add the Leopard model file to your Android application by:

1. Either creat a model in [Picovoice Console](https://console.picovoice.ai/) or get the default model in [/lib/common/leopard_params.pv](/lib/common/leopard_params.pv).
2. Add the model as a bundled resource by placing it under the `assets` directory of your Android application.

Create an instance of the engine with the Leopard Builder class by passing in the Android app context:

```java
import ai.picovoice.leopard.*;

final String accessKey = "..."; // AccessKey provided by Picovoice Console (https://picovoice.ai/console/)
final String modelPath = "${MODEL_FILE}";
try {
    Leopard handle = new Leopard.Builder(accessKey).setModelPath(modelPath).build(appContext);
} catch (LeopardException ex) { }
```

Transcribe an audio file either by in an absolute path to the file:

```java
File audioFile = new File("${AUDIO_FILE_PATH}");
String transcript = handle.processFile(audioFile.getAbsolutePath());
```

When done resources have to be released explicitly:

```java
handle.delete();
```

## Demo App

For example usage refer to our [Android demo application](/demo/android).
