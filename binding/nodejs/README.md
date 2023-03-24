# Leopard Binding for Node.js

Made in Vancouver, Canada by [Picovoice](https://picovoice.ai)

Leopard is an on-device speech-to-text engine. Leopard is:

- Private; All voice processing runs locally.
- Accurate [[1]](https://picovoice.ai/docs/benchmark/stt/#results)
- Compact and Computationally-Efficient [[2]](https://github.com/Picovoice/speech-to-text-benchmark#rtf)
- Cross-Platform:
    - Linux (x86_64), macOS (x86_64, arm64), and Windows (x86_64)
    - Android and iOS
    - Chrome, Safari, Firefox, and Edge
    - Raspberry Pi (4, 3) and NVIDIA Jetson Nano

## Compatibility

- Node.js 12+
- Runs on Linux (x86_64), macOS (x86_64, arm64), Windows (x86_64), Raspberry Pi (4, 3), and NVIDIA Jetson Nano.

## Installation

```console
npm install @picovoice/leopard-node
```

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

### Usage

Create an instance of the engine and transcribe an audio file:

```javascript
const {Leopard} = require("@picovoice/leopard-node");

const accessKey = "${ACCESS_KEY}" // Obtained from the Picovoice Console (https://console.picovoice.ai/)
const handle = new Leopard(accessKey);

const result = handle.processFile('${AUDIO_PATH}');
console.log(result.transcript);
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console](https://console.picovoice.ai/) and
`${AUDIO_PATH}` to the path an audio file. Finally, when done be sure to explicitly release the resources using
`handle.release()`.

## Language Model

The Leopard Node.js SDK comes preloaded with a default English language model (`.pv` file).
Default models for other supported languages can be found in [lib/common](../../lib/common).

Create custom language models using the [Picovoice Console](https://console.picovoice.ai/). Here you can train
language models with custom vocabulary and boost words in the existing vocabulary.

Pass in the `.pv` file via the `modelPath` parameter in the `options` argument of the Leopard `constructor()`:
```javascript
const handle = new Leopard(accessKey, { modelPath: "${MODEL_PATH}"});
```

## Demos

[Leopard Node.js demo package](https://www.npmjs.com/package/@picovoice/leopard-node-demo) provides command-line utilities for processing audio using leopard.
