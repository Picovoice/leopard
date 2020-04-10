# Leopard

Made in Vancouver, Canada by [Picovoice](https://picovoice.ai)

Leopard is an on-device Speech-to-Text engine.

Leopard is:

* offline: runs locally, without an Internet connection. 
* highly accurate [[1]](https://github.com/Picovoice/speech-to-text-benchmark#results).
* compact and computationally-efficient [[1]](https://github.com/Picovoice/speech-to-text-benchmark#results).
* cross-platform. Linux (x86_64), Mac (x86_64), Windows (x86_64), web browsers, Android, iOS, Raspberry Pi, and
BeagleBone are supported. Linux (x86_64) is available for personal and non-commercial use, free of charge. Other
platforms are only available under a commercial license.
* customizable. Allows adding new words and adapting to different contexts (Available only under a commercial license).

## Table of Contents
- [Leopard](#leopard)
  - [Table of Contents](#table-of-contents)
  - [License](#license)
  - [Use Cases](#use-cases)
  - [Structure of Repository](#structure-of-repository)
  - [Picovoice Console and License File](#picovoice-console-and-license-file)
  - [Running Demo Applications](#running-demo-applications)
    - [Python Demo Application](#python-demo-application)
    - [C Demo Application](#c-demo-application)
  - [Integration](#integration)
    - [Python](#python)
    - [C](#c)
  - [Releases](#releases)
    - [V1.0.0 — January 14th, 2020](#v100--january-14th-2020)

## License

This repository is provided for **personal & non-commercial** use only. Refer to [LICENSE](/LICENSE) for details. If you
wish to use Leopard in a commercial product, [contact Picovoice](https://picovoice.ai/contact/).

## Use Cases

Leopard is intended to be used for open-domain transcription applications. It is an offline transcription engine (i.e. file-based processing).

* If real-time feedback (incremental transcription results) is required, see
[Cheetah](https://github.com/Picovoice/cheetah).
* If you need to understand naturally-spoken (complex) commands within a specific domain, see
[Rhino](https://github.com/Picovoice/rhino).
* If you need to recognize a small set of fixed voice commands or activate a device using voice, see
[Porcupine](https://github.com/Picovoice/porcupine).

## Structure of Repository

Leopard is shipped as a dynamic library. The binary files for supported platforms are located under
[lib](/lib), and header files are at [include](/include). Bindings are available at [binding](/binding) to facilitate
usage from higher-level languages/platforms. Demo applications are at [demo](/demo). Finally, [resources](/resources) is
a placeholder for data used by various applications within the repository.

## Picovoice Console and License File

In order to run, Leopard requires a valid license file ('.lic' extension). To obtain a time-limited evaluation license file, visit [Picovoice Console](https://console.picovoice.ai). To obtain a commercial license, [contact Picovoice](https://picovoice.ai/contact/).

## Running Demo Applications

### Python Demo Application

The demo transcribes a set of audio files provided as command line arguments. The demo has been tested using Python 3.6
on a machine running Ubuntu 18.04 (x86_64). Note that the audio files need to be single-channel, 16KHz, and 16-bit
linearly-encoded. For more information about audio requirements, refer to [pv_leopard.h](/include/pv_leopard.h). The
following transcribes the WAV file located in the resource directory:

```bash
python demo/python/leopard_demo.py --audio_paths resources/audio_samples/test.wav --license_path PATH_TO_YOUR_LEOPARD_LICENSE_FILE
```

In order to transcribe multiple files provide their paths:

```bash
python demo/python/leopard_demo.py --audio_paths PATH_TO_AUDIO_FILE_1 PATH_TO_AUDIO_FILE_2 PATH_TO_AUDIO_FILE_3 --license_path PATH_TO_YOUR_LEOPARD_LICENSE_FILE
```

### C Demo Application

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
./PATH_TO_YOUR_LEOPARD_LICENSE_FILE \
./resources/audio_samples/test.wav
```

## Integration

### Python

[leopard.py](/binding/python/leopard.py) provides a Python binding. Below is a quick demonstration of how to construct
an instance:

```python
library_path = ...  # the file is available under lib/linux/x86_64/libpv_leopard.so
acoustic_model_path = ...  # the file is available under lib/common/acoustic_model.pv
language_model_path = ...  # the file is available under lib/common/language_model.pv
license_path = ...  # The .lic file is available from Picovoice Console (https://console.picovoice.ai)

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
const char *license_path = ... // The .lic file is available from Picovoice Console (https://console.picovoice.ai)

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

### V1.0.0 — January 14th, 2020

* Initial release.
