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
    - Raspberry Pi (3, 4, 5)

## Compatibility

- Android 5.0 (SDK 21+)

## Installation

Leopard is hosted on Maven Central. To include the package in your Android project, ensure you have
included `mavenCentral()` in your top-level `build.gradle` file and then add the following to your
app's `build.gradle`:

```groovy
dependencies {
    // ...
    implementation 'ai.picovoice:leopard-android:${LATEST_VERSION}'
}
```

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Usage

Create an instance of the engine with the Leopard Builder class by passing in the `accessKey`, `modelPath` and Android app context:

```java
import ai.picovoice.leopard.*;

final String accessKey = "${ACCESS_KEY}"; // AccessKey provided by Picovoice Console (https://console.picovoice.ai/)
final String modelPath = "${MODEL_FILE_PATH}"; // path relative to the assets folder or absolute path to file on device
try {
    Leopard leopard = new Leopard.Builder()
        .setAccessKey(accessKey)
        .setModelPath(modelPath)
        .build(appContext);
} catch (LeopardException ex) { }
```

Transcribe an audio file by providing the absolute path to the file:

```java
File audioFile = new File("${AUDIO_FILE_PATH}");
LeopardTranscript transcript = leopard.processFile(audioFile.getAbsolutePath());
```

Supported audio file formats are `3gp (AMR)`, `FLAC`, `MP3`, `MP4/m4a (AAC)`, `Ogg`, `WAV` and `WebM`.

Transcribe raw audio data (sample rate of 16 kHz, 16-bit linearly encoded and 1 channel):
```java
short[] getAudioData() {
    // ...
}
LeopardTranscript transcript = leopard.process(getAudioData());
```

When done, release resources explicitly:

```java
leopard.delete();
```

### Language Model

Add the Leopard model file to your Android application by:

1. Either create a model in [Picovoice Console](https://console.picovoice.ai/) or use one of the default language models found in [lib/common](../../lib/common).
2. Add the model as a bundled resource by placing it under the assets directory of your Android project (`src/main/assets/`).

### Word Metadata

Along with the transcript, Leopard returns metadata for each transcribed word. Available metadata items are:

- **Start Time:** Indicates when the word started in the transcribed audio. Value is in seconds.
- **End Time:** Indicates when the word ended in the transcribed audio. Value is in seconds.
- **Confidence:** Leopard's confidence that the transcribed word is accurate. It is a number within `[0, 1]`.
- **Speaker Tag:** If speaker diarization is enabled on initialization, the speaker tag is a non-negative integer identifying unique speakers, with `0` reserved for unknown speakers. If speaker diarization is not enabled, the value will always be `-1`.

## Demo App

For example usage, refer to our [Android demo application](../../demo/android).
