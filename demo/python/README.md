# Leopard Speech-to-Text Demos

Made in Vancouver, Canada by [Picovoice](https://picovoice.ai)

## Leopard

Leopard is an on-device speech-to-text engine. Leopard is:

- Private; All voice processing runs locally. 
- Accurate [[1]](https://github.com/Picovoice/speech-to-text-benchmark#results)
- Compact and Computationally-Efficient [[1]](https://github.com/Picovoice/speech-to-text-benchmark#results)
- Cross-Platform:
  - Linux (x86_64)
  - macOS (x86_64, arm64)
  - Windows (x86_64)
  - Raspberry Pi (4, 3)
  - NVIDIA Jetson Nano

## Compatibility

- Python 3
- Runs on Linux (x86_64), macOS (x86_64, arm64), Windows (x86_64), Raspberry Pi (4, 3), and NVIDIA Jetson Nano.

## Installation

```console
pip3 install pvleoparddemo
```

## AccessKey

AccessKey is your authentication and authorization token for deploying Picovoice SDKs, including Leopard. Anyone who is
using Picovoice  needs to have a valid AccessKey. YOU MUST KEEP YOUR AccessKey SECRET! You do need internet connectivity
to validate your AccessKey with Picovoice license servers even though the voice recognition is running 100% offline.

AccessKey also verifies that your usage is within the limits of your account. Everyone who signs up for
[Picovoice Console](https://console.picovoice.ai/) receives the `Free Tier` usage rights as described on
[here](https://picovoice.ai/pricing/). If you wish to increase your limits, you can purchase a subscription plan.

## Usage

### File Demo

Run the following in the terminal:

```bash
leopard_demo_file --access-key ${ACCESS_KEY} --audio-paths ${AUIDO_PATH}
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console and `${AUDIO_PATH}` with a path to an audio file you
wish to transcribe.

### Microphone Demo

Run the following in the terminal:

```bash
leopard_demo_mic --access-key ${ACCESS_KEY}
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console.
