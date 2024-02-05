# Leopard Binding for Java

## Leopard Speech-to-Text Engine

Made in Vancouver, Canada by [Picovoice](https://picovoice.ai)

Leopard is an on-device speech-to-text engine. Leopard is:

- Private; All voice processing runs locally.
- Accurate [[1]](https://picovoice.ai/docs/benchmark/stt/#results)
- Compact and Computationally-Efficient [[2]](https://github.com/Picovoice/speech-to-text-benchmark#rtf)
- Cross-Platform:
    - Linux (x86_64), macOS (x86_64, arm64), and Windows (x86_64)
    - Android and iOS
    - Chrome, Safari, Firefox, and Edge
    - Raspberry Pi (5, 4, 3) and NVIDIA Jetson Nano

## Compatibility

- Java 11+
- Runs on Linux (x86_64), macOS (x86_64, arm64), Windows (x86_64), Raspberry Pi (5, 4, 3), and NVIDIA Jetson Nano.

## Installation

The latest Java bindings are available from the Maven Central Repository at:

```console
ai.picovoice:leopard-java:${version}
```

If you're using Gradle for your Java project, include the following line in your `build.gradle` file to add Leopard:

```console
implementation 'ai.picovoice:leopard-java:${version}'
```

If you're using IntelliJ, open the Project Structure dialog (`File > Project Structure`) and go to the `Libraries`
section.
Click the plus button at the top to add a new project library and select `From Maven...`. Search
for `ai.picovoice:leopard-java`
in the search box and add the latest version to your project.

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using
Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Usage

Create an instance of the engine with the Leopard Builder class and transcribe an audio file:

```java
import ai.picovoice.leopard.*;

final String accessKey = "${ACCESS_KEY}";
final String audioPath = "${AUDIO_FILE_PATH}";

try {
    Leopard leopard = new Leopard.Builder()
        .setAccessKey(accessKey)
        .build();
    LeopardTranscript result = leopard.processFile(audioPath);
    leopard.delete();
} catch (LeopardException ex) { }

System.out.println(result.getTranscriptString());
```


Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console](https://console.picovoice.ai/) and `${AUDIO_FILE_PATH}`
to the path an audio file.
Finally, when done be sure to explicitly release the resources using `leopard.delete()`.

### Language Model

The Leopard Java SDK comes preloaded with a default English language model (`.pv` file).
Default models for other supported languages can be found in [lib/common](../../lib/common).

Create custom language models using the [Picovoice Console](https://console.picovoice.ai/). Here you can train
language models with custom vocabulary and boost words in the existing vocabulary.

Pass in the `.pv` file via the `.setModelPath()` Builder argument:
```java
final String modelPath = "${MODEL_FILE_PATH}";

Leopard leopard = new Leopard.Builder()
        .setAccessKey(accessKey)
        .setModelPath(modelPath)
        .build();
```

### Word Metadata

Along with the transcript, Leopard returns metadata for each transcribed word. Available metadata items are:

- **Start Time:** Indicates when the word started in the transcribed audio. Value is in seconds.
- **End Time:** Indicates when the word ended in the transcribed audio. Value is in seconds.
- **Confidence:** Leopard's confidence that the transcribed word is accurate. It is a number within `[0, 1]`.
- **Speaker Tag:** If speaker diarization is enabled on initialization, the speaker tag is a non-negative integer identifying unique speakers, with `0` reserved for unknown speakers. If speaker diarization is not enabled, the value will always be `-1`.

## Demo App

For example usage, refer to our [Java demos](../../demo/java).
