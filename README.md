# Leopard

Made in Vancouver, Canada by [Picovoice](https://picovoice.ai)

[![Twitter URL](https://img.shields.io/twitter/url?label=%40AiPicovoice&style=social&url=https%3A%2F%2Ftwitter.com%2FAiPicovoice)](https://twitter.com/AiPicovoice)
[![YouTube Channel Views](https://img.shields.io/youtube/channel/views/UCAdi9sTCXLosG1XeqDwLx7w?label=YouTube&style=social)](https://www.youtube.com/channel/UCAdi9sTCXLosG1XeqDwLx7w)

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
  - BeagleBone

## Table of Contents
- [Leopard](#leopard)
  - [Table of Contents](#table-of-contents)
  - [AccessKey](#accesskey)
  - [Demos](#demos)
    - [Python](#python-demos)
    - [C](#c-demo)
  - [SDKs](#sdks)
    - [Python](#python)
    - [C](#c)
  - [Releases](#releases)
  
## AccessKey

AccessKey is your authentication and authorization token for deploying Picovoice SDKs. Anyone who is using Picovoice
needs to have a valid AccessKey. You must keep your AccessKey secret! You do need internet connectivity to validate your
AccessKey with Picovoice license servers even though the voice recognition is running 100% offline.

AccessKey also verifies that your usage is within the limits of your account. Everyone who signs up for
[Picovoice Console](https://console.picovoice.ai/) receives the `Free Tier` usage rights as  described 
[here](https://picovoice.ai/pricing/). If you wish to increase your limits, you need to purchase a subscription plan.

## Demos

### Python Demos

Install the demo package:

```console
pip3 install pvleoparddemo
```

Run the following in the terminal:

```bash
leopard_demo_file --access-key ${ACCESS_KEY} --audio-paths ${AUIDO_PATH}
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console and `${AUDIO_PATH}` with path to an audio file you
wish to transcribe.

### C Demo

Build the demo:

```console
cmake -S demo/c/ -B demo/c/build && cmake --build demo/c/build
```

Run the demo:

```console
./demo/c/build/leopard_demo -a ${ACCESS_KEY} -l ${LIBRARY_PATH} -m ${MODEL_PATH} ${AUDIO_PATH}
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console, `${LIBRARY_PATH}` with the path to appropriate
library under [lib](/lib), `${MODEL_PATH}` to path to [default model file](/lib/common/leopard_params.pv)
(or your own custom one), and `${AUDIO_PATH}` with path to an audio file you wish to transcribe.

## SDKs

### Python

Install the Python SDK:

```console
pip3 install pvleopard
```

Create an instance of the engine:

```python
import pvleopard

access_key = ... # AccessKey obtained from Picovoice Console (https://picovoice.ai/console/)

handle = pvleopard.create(access_key=access_key)
```

When initialized, valid sample rate can be obtained using `handle.sample_rate`. The `handle` can be used to transcribe
audio data:

```python
pcm = ... # audio data read from a file. Needs to be 16kHz and 16-bit single channel.
handle.process(pcm)
```

Finally, when done be sure to explicitly release the resources using `handle.delete()`.

### C

Create an instance of Leopard:

```c
const char *access_key = ... // AccessKey obtained from Picovoice Console (https://picovoice.ai/console/)
const char *model_path = ... // the file is available under lib/common/leopard_params.pv

pv_leopard_t *handle = NULL;
const pv_status_t status = pv_leopard_init(access_key, model_path, &handle);
if (status != PV_STATUS_SUCCESS) {
    // error handling logic
}
```

Now the `handle` can be used to process audio. Leopard accepts single-channel 16-bit linearly-encoded audio. The sample
rate can be retrieved using `pv_sample_rate()`.

```C
const int16_t *pcm = ... // audio data to be transcribed
const int32_t num_samples = ... // number of samples to process

char *transcript;
const pv_status_t status = pv_leopard_process(handle, pcm, num_samples, &transcript);
if (status != PV_STATUS_SUCCESS) {
    // error handling logic
}

// the caller is required to free the transcription buffer when done.
free(transcript);
```

Finally, when done be sure to release resources acquired.

```C
pv_leopard_delete(handle);
```

## Releases

### V1.0.0 — January 14th, 2022

* Initial release.
