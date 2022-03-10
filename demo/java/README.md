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

Build the demo jars with Gradle:
```console
cd leopard/demo/java
./gradlew build
```

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret. 
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Usage

Navigate to the output directory to use the demos:

```console
cd leopard/demo/java/build/libs
```

### File Demo

The file demo uses Leopard to get speech-to-text results from an audio file.

```console
java -jar leopard-file-demo.jar -a ${ACCESS_KEY} -i ${AUDIO_PATH}
```

### Microphone Demo

The microphone demo opens an audio stream from a microphone, records audio and performces speech-to-text transcription from the recorded audio:

```console
java -jar leopard-mic-demo.jar -a ${ACCESS_KEY}
```

It is possible that the default audio input device is not the one you wish to use. There are a couple of debugging facilities baked into the demo application to solve this. First, type the following into the console:

```console
java -jar leopard-mic-demo.jar -sd
```

It provides information about various audio input devices on the box. On a Windows PC, this is the output:

```
Available input devices:

    Device 0: Microphone Array (Realtek(R) Au
    Device 1: Microphone Headset USB
```

You can use the device index to specify which microphone to use for the demo. For instance, if you want to use the Headset microphone in the above example, you can invoke the demo application as below:

```console
java -jar leopard-mic-demo.jar -a ${ACCESS_KEY} -di 1
```
