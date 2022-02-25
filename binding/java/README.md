# Leopard Speech-to-Text Engine

Made in Vancouver, Canada by [Picovoice](https://picovoice.ai)

## Leopard

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

- Java 11+
- Runs on Linux (x86_64), macOS (x86_64, arm64), Windows (x86_64), Raspberry Pi (4, 3), and NVIDIA Jetson Nano.

## Installation

The latest Java bindings are available from the Maven Central Repository at:

```console
ai.picovoice:leopard-java:${version}
```

If you're using Gradle for your Java project, include the following line in your `build.gradle` file to add Leopard:
```console
implementation 'ai.picovoice:leopard-java:${version}'
```

If you're using IntelliJ, open the Project Structure dialog (`File > Project Structure`) and go to the `Libraries` section.
Click the plus button at the top to add a new project library and select `From Maven...`. Search for `ai.picovoice:leopard-java`
in the search box and add the latest version to your project.

## AccessKey

The Leopard SDK requires a valid `AccessKey` at initialization. `AccessKey`s act as your credentials when using Leopard SDKs.
You can create your `AccessKey` for free. Make sure to keep your `AccessKey` secret.

To obtain your `AccessKey`:
1. Login or Signup for a free account on the [Picovoice Console](https://picovoice.ai/console/).
2. Once logged in, go to the [`AccessKey` tab](https://console.picovoice.ai/access_key) to create one or use an existing `AccessKey`.

## Usage

Create an instance of the engine with the Leopard Builder class and transcribe an audio file:

```java
import ai.picovoice.leopard.*;

final String accessKey = "${ACCESS_KEY}";

try {
    Leopard leopard = new Leopard.Builder().setAccessKey(accessKey).build();
    String transcript = leopard.processFile("${AUDIO_PATH}");
    leopard.delete();
} catch (LeopardException ex) { }

System.out.println(transcript);
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console]((https://console.picovoice.ai/)) and `${AUDIO_PATH}` to the path an audio file. Finally, when done be sure to explicitly release the resources using `leopard.delete()`.

## Demo App

For example usage refer to our [Java demos](/demo/java).
