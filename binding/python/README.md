# Leopard Speech-to-Text Engine

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

- Python 3.5+
- Runs on Linux (x86_64), macOS (x86_64, arm64), Windows (x86_64), Raspberry Pi (4, 3), and NVIDIA Jetson Nano.

## Installation

```console
pip3 install pvleopard
```

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

### Usage

Create an instance of the engine and transcribe an audio file:

```python
import pvleopard

handle = pvleopard.create(access_key='${ACCESS_KEY}')

transcript, words = handle.process_file('${AUDIO_PATH}')
print(transcript)
for word in words:
    print(
      "{word=\"%s\" start_sec=%.2f end_sec=%.2f confidence=%.2f}"
      % (word.word, word.start_sec, word.end_sec, word.confidence))
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console](https://console.picovoice.ai/) and
`${AUDIO_PATH}` to the path an audio file. Finally, when done be sure to explicitly release the resources using
`handle.delete()`.

## Language Model

The Leopard Python SDK comes preloaded with a default English language model (`.pv` file). 
Default models for other supported languages can be found in [lib/common](../../lib/common). 

Create custom language models using the [Picovoice Console](https://console.picovoice.ai/). Here you can train
language models with custom vocabulary and boost words in the existing vocabulary.

Pass in the `.pv` file via the `model_path` argument:
```python
handle = pvleopard.create(
    access_key='${ACCESS_KEY}',
    model_path='${MODEL_PATH}')
```

## Demos

[pvleoparddemo](https://pypi.org/project/pvleoparddemo/) provides command-line utilities for processing audio using
Leopard.
