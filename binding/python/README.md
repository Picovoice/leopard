# Leopard Binding for Python

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
  - Raspberry Pi (5, 4, 3) and NVIDIA Jetson Nano

## Compatibility

- Python 3.7+
- Runs on Linux (x86_64), macOS (x86_64, arm64), Windows (x86_64), Raspberry Pi (4, 3), and NVIDIA Jetson Nano.

## Installation

```console
pip3 install pvleopard
```

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Usage

Create an instance of the engine and transcribe an audio file:

```python
import pvleopard

leopard = pvleopard.create(access_key='${ACCESS_KEY}')

transcript, words = leopard.process_file('${AUDIO_FILE_PATH}')
print(transcript)
for word in words:
    print(
      "{word=\"%s\" start_sec=%.2f end_sec=%.2f confidence=%.2f speaker_tag=%d}"
      % (word.word, word.start_sec, word.end_sec, word.confidence, word.speaker_tag))
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console](https://console.picovoice.ai/) and
`${AUDIO_FILE_PATH}` to the path an audio file.

Finally, when done be sure to explicitly release the resources:
```python
leopard.delete()
```

### Language Model

The Leopard Python SDK comes preloaded with a default English language model (`.pv` file).
Default models for other supported languages can be found in [lib/common](../../lib/common).

Create custom language models using the [Picovoice Console](https://console.picovoice.ai/). Here you can train
language models with custom vocabulary and boost words in the existing vocabulary.

Pass in the `.pv` file via the `model_path` argument:
```python
leopard = pvleopard.create(
    access_key='${ACCESS_KEY}',
    model_path='${MODEL_FILE_PATH}')
```

### Word Metadata

Along with the transcript, Leopard returns metadata for each transcribed word. Available metadata items are:

- **Start Time:** Indicates when the word started in the transcribed audio. Value is in seconds.
- **End Time:** Indicates when the word ended in the transcribed audio. Value is in seconds.
- **Confidence:** Leopard's confidence that the transcribed word is accurate. It is a number within `[0, 1]`.
- **Speaker Tag:** If speaker diarization is enabled on initialization, the speaker tag is a non-negative integer identifying unique speakers, with `0` reserved for unknown speakers. If speaker diarization is not enabled, the value will always be `-1`.

## Demos

[pvleoparddemo](https://pypi.org/project/pvleoparddemo/) provides command-line utilities for processing audio using
Leopard.
