# Leopard Binding for Android

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

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Usage

Add the Leopard model file to your Android application by:

1. Either create a model in [Picovoice Console](https://console.picovoice.ai/) or use the [default model](../../lib/common).
2. Add the model as a bundled resource by placing it under the `assets` directory of your Android application.

Create an instance of the engine with the Leopard Builder class by passing in the `accessKey`, `modelPath` and Android app context:

```java
import ai.picovoice.leopard.*;

final String accessKey = "${ACCESS_KEY}"; // AccessKey provided by Picovoice Console (https://console.picovoice.ai/)
final String modelPath = "${MODEL_FILE}";
try {
    Leopard handle = new Leopard.Builder()
        .setAccessKey(accessKey)
        .setModelPath(modelPath)
        .build(appContext);
} catch (LeopardException ex) { }
```

Transcribe an audio file by providing the absolute path to the file:

```java
File audioFile = new File("${AUDIO_FILE_PATH}");
LeopardTranscript transcript = handle.processFile(audioFile.getAbsolutePath());
```

Supported audio file formats are `3gp (AMR)`, `FLAC`, `MP3`, `MP4/m4a (AAC)`, `Ogg`, `WAV` and `WebM`.

Transcribe raw audio data (sample rate of 16 kHz, 16-bit linearly encoded and 1 channel):
```java
short[] getAudioData() {
    // ...    
}
LeopardTranscript transcript = handle.process(getAudioData());
```

When done, release resources explicitly:

```java
handle.delete();
```

## Demo App

For example usage, refer to our [Android demo application](../../demo/android).
