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
  - Raspberry Pi
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
    - [V1.0.0 — January 14th, 2020](#v100--january-14th-2022)
  
## AccessKey

AccessKey is your authentication and authorization token for deploying Picovoice SDKs. Anyone who is using Picovoice
needs to have a valid AccessKey. You must keep your AccessKey secret! You do need internet connectivity to validate your
AccessKey with Picovoice license servers even though the voice recognition is running 100% offline.

AccessKey also verifies that your usage is within the limits of your account. Everyone who signs up for
[Picovoice Console](https://console.picovoice.ai/) receives the `Free Tier` usage rights as  described 
[here](https://picovoice.ai/pricing/). If you wish to increase your limits, you need to purchase a subscription plan.

## Demos

### Python Demos

The demo transcribes a set of audio files provided as command line arguments. The demo has been tested using Python 3.6
on a machine running Ubuntu 18.04 (x86_64). Note that the audio files need to be single-channel, 16KHz, and 16-bit
linearly-encoded. For more information about audio requirements, refer to [pv_leopard.h](/include/pv_leopard.h). The
following transcribes the WAV file located in the resource directory:

```bash
python demo/python/leopard_demo_file.py --audio_paths resources/audio_samples/test.wav --license_path ${PATH_TO_YOUR_LEOPARD_LICENSE_FILE}
```

In order to transcribe multiple files provide their paths:

```bash
python demo/python/leopard_demo_file.py --audio_paths ${PATH_TO_AUDIO_FILE_1} ${PATH_TO_AUDIO_FILE_2} ${PATH_TO_AUDIO_FILE_3} --license_path ${PATH_TO_YOUR_LEOPARD_LICENSE_FILE}
```

### C Demo

This demo application accepts a list of WAV files as input and returns their transcripts. Note that the demo expects the
audio files to be WAV, 16KHz, and 16-bit linearly-encoded. It does not perform any verification to assure the
compatibility or correctness of the input audio files. Set the current working directory to the root of the repository.
The demo can be built using `gcc`:

```bash
gcc -I include/ -O3 demo/c/leopard_demo.c -ldl -o leopard_demo
```

The usage can be attained with:

```bash
./leopard_demo
```

Then it can be used as follows:

```bash
./leopard_demo \
./lib/linux/x86_64/libpv_leopard.so \
./lib/common/acoustic_model.pv \
./lib/common/language_model.pv \
${PATH_TO_YOUR_LEOPARD_LICENSE_FILE} \
./resources/audio_samples/test.wav
```

## SDKs

### Python

[leopard.py](/binding/python/leopard.py) provides a Python binding. Below is a quick demonstration of how to construct
an instance:

```python
library_path = ...  # the file is available under lib/linux/x86_64/libpv_leopard.so
acoustic_model_path = ...  # the file is available under lib/common/acoustic_model.pv
language_model_path = ...  # the file is available under lib/common/language_model.pv
license_path = ...  # The .lic file is available from Picovoice Console (https://picovoice.ai/console/)

handle = Leopard(library_path, acoustic_model_path, language_model_path, license_path)
```

When initialized, valid sample rate can be retrieved using `handle.sample_rate`. Additionally, Leopard accepts
single-channel 16-bit linearly-encoded audio.

```python
audio = ... # audio data to be transcribed as a NumPy array

transcript = handle.process(audio)
```

When finished, release the acquired resources:

```python
handle.delete()
```

### C

Leopard is implemented in ANSI C and therefore can be directly linked to C applications.
[pv_leopard.h](/include/pv_leopard.h) header file contains relevant information. An instance of Leopard object can be
constructed as follows.

```c
const char *acoustic_model_path = ... // the file is available under lib/common/acoustic_model.pv
const char *language_model_path = ... // the file is available under lib/common/language_model.pv
const char *license_path = ... // The .lic file is available from Picovoice Console (https://picovoice.ai/console/)

pv_leopard_t *handle;
const pv_status_t status = pv_leopard_init(acoustic_model_path, language_model_path, license_path, &handle);
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
