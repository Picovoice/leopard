# Leopard Speech-to-Text Engine

Made in Vancouver, Canada by [Picovoice](https://picovoice.ai)

Leopard is an on-device speech-to-text engine. Leopard is:

- Private; All voice processing runs locally.
- [Accurate](https://picovoice.ai/docs/benchmark/stt/#results)
- [Compact and Computationally-Efficient](https://github.com/Picovoice/speech-to-text-benchmark#rtf)
- Cross-Platform:
  - Linux (x86_64), macOS (x86_64, arm64), and Windows (x86_64)
  - Android and iOS
  - Chrome, Safari, Firefox, and Edge
  - Raspberry Pi (4, 3) and NVIDIA Jetson Nano

## Compatibility

- go 1.16+
- Runs on Linux (x86_64), macOS (x86_64, arm64), Windows (x86_64), Raspberry Pi (4, 3), and NVIDIA Jetson Nano.
- **Windows**: The Go binding requires `cgo`, which means that you need to install a gcc compiler like [Mingw](http://mingw-w64.org/) to build it properly. 
  - Go versions less than `1.20` requires `gcc` version `11` or lower.

## Installation

```console
go get github.com/Picovoice/leopard/binding/go
```

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

### Usage

Create an instance of the engine and transcribe an audio file:

```go
import . "github.com/Picovoice/leopard/binding/go"

leopard := NewLeopard("${ACCESS_KEY}")
err := leopard.Init()
if err != nil {
    // handle err init
}
defer leopard.Delete()

transcript, words, err := leopard.ProcessFile("${AUDIO_PATH}")
if err != nil {
    // handle process error
}

print(transcript)
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console](https://console.picovoice.ai/) and
`${AUDIO_PATH}` to the path an audio file. Finally, when done be sure to explicitly release the resources using
`leopard.Delete()`.

## Language Model

The Leopard Go SDK comes preloaded with a default English language model (`.pv` file).
Default models for other supported languages can be found in [lib/common](../../lib/common).

Create custom language models using the [Picovoice Console](https://console.picovoice.ai/). Here you can train
language models with custom vocabulary and boost words in the existing vocabulary.

Pass in the `.pv` file by setting `.ModelPath` on an instance of Leopard before initializing:
```go
leopard := NewLeopard("${ACCESS_KEY}")
leopard.ModelPath = "${MODEL_PATH}"
err := leopard.Init()
```

## Demos

Check out the Leopard Go demos [here](https://github.com/Picovoice/leopard/tree/master/demo/go).
