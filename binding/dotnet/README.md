# Leopard Binding for .NET

## Leopard Speech-to-Text Engine

Made in Vancouver, Canada by [Picovoice](https://picovoice.ai)

Leopard is an on-device speech-to-text engine. Leopard is:

- Private; All voice processing runs locally.
- [Accurate](https://picovoice.ai/docs/benchmark/stt/#results)
- [Compact and Computationally-Efficient](https://github.com/Picovoice/speech-to-text-benchmark#rtf)
- Cross-Platform:
  - Linux (x86_64), macOS (x86_64, arm64), and Windows (x86_64)
  - Android and iOS
  - Chrome, Safari, Firefox, and Edge
  - Raspberry Pi (5, 4, 3) and NVIDIA Jetson Nano

## Requirements

- .NET 6.0

## Compatibility

Platform compatible with .NET Framework 4.6.1+:

- Windows (x86_64)

Platforms compatible with .NET Core 2.0+:

- Linux (x86_64)
- macOS (x86_64)
- Windows (x86_64)

Platforms compatible with .NET Core 3.1+:

- Raspberry Pi:
  - 3 (32 and 64 bit)
  - 4 (32 and 64 bit)
- NVIDIA Jetson Nano

Platform compatible with .NET 6.0+:

- macOS (arm64)

## Installation

You can install the latest version of Leopard by getting the latest [Leopard Nuget package](https://www.nuget.org/packages/Leopard/) in Visual Studio or using the .NET CLI:

```console
dotnet add package Leopard
```

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Usage

Create an instance of the engine and transcribe an audio file:

```csharp
using Pv;

const string accessKey = "${ACCESS_KEY}";
const string audioPath = "${AUDIO_FILE_PATH}";

Leopard leopard = Leopard.Create(accessKey);

LeopardTranscript result = leopard.ProcessFile(audioPath);
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console](https://console.picovoice.ai/). Finally, when done release the resources using `leopard.Dispose()`.

### Language Model

The Leopard .NET SDK comes preloaded with a default English language model (`.pv` file).
Default models for other supported languages can be found in [lib/common](../../lib/common).

Create custom language models using the [Picovoice Console](https://console.picovoice.ai/). Here you can train
language models with custom vocabulary and boost words in the existing vocabulary.

Pass in the `.pv` file via the `modelPath` argument in the `Create()` constructor:
```csharp
const string modelPath = "${MODEL_FILE_PATH}";

Leopard leopard = Leopard.Create(accessKey, modelPath);
```

### Word Metadata

Along with the transcript, Leopard returns metadata for each transcribed word. Available metadata items are:

- **Start Time:** Indicates when the word started in the transcribed audio. Value is in seconds.
- **End Time:** Indicates when the word ended in the transcribed audio. Value is in seconds.
- **Confidence:** Leopard's confidence that the transcribed word is accurate. It is a number within `[0, 1]`.
- **Speaker Tag:** If speaker diarization is enabled on initialization, the speaker tag is a non-negative integer identifying unique speakers, with `0` reserved for unknown speakers. If speaker diarization is not enabled, the value will always be `-1`.

## Demos

The [Leopard dotnet demo project](https://github.com/Picovoice/leopard/tree/master/demo/dotnet) is a .NET Core console app that allows for processing real-time audio (i.e. microphone) and files using Leopard.
