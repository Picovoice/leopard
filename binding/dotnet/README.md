# Leopard Binding for .NET

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

## Requirements

- .NET Core 3.1

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
const string audioPath = "/absolute/path/to/audio_file";

Leopard handle = Leopard.Create(accessKey);

Console.Write(handle.ProcessFile(audioPath));
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console]((https://console.picovoice.ai/)). Finally, when done release the resources using `handle.Dispose()`.

The model file contains the parameters for the Leopard engine. You may create bespoke language models using [Picovoice Console](https://picovoice.ai/console/) and then pass in the relevant file.

```csharp
using Pv;

const string accessKey = "${ACCESS_KEY}";
string modelPath = "/absolute/path/to/model.pv";

Leopard handle = Leopard.Create(accessKey, modelPath);
```

## Demos

The [Leopard dotnet demo project](/demo/dotnet) is a .NET Core console app that allows for processing real-time audio (i.e. microphone) and files using Leopard.
