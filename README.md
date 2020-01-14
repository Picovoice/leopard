# Leopard

Made in Vancouver, Canada by [Picovoice](https://picovoice.ai)

Leopard is an on-device **speech-to-text** engine. Leopard is:

* offline and runs locally without an internet connection. Nothing is sent to cloud to fully protect users' **privacy**. 
* compact and computationally-efficient making it suitable for **IoT** applications.
* **[highly-accurate](https://github.com/Picovoice/stt-benchmark#results)**.
* **cross-platform**. **Raspberry Pi**, **Beagle Bone**, **Android**, **iOS**, **Linux (x86_64)**, **Mac**,
**Windows (x86_64)**, and **Web Browsers** (**WebAssembly**) are supported. **Linux (x86_64)** is available for
personal and non-commercial use free of charge. Other platforms are only available under commercial license.
* **customizable**. Allows adding new words and adapting to different contexts (Available only under commercial license).

## License

This repository is provided for **non-commercial** use only. Please refer to [LICENSE](/LICENSE) for details.
The [license file](/resources/license) in this repository is time-limited. Picovoice assures that the license is valid
for at least 30 days at any given time.

If you wish to use Leopard in a commercial product request access [here](https://picovoice.ai/contact.html). The
following table depicts the feature comparison between the free and commercial versions:

|  | Free | Commercial |
--- | :---: | :---:
**Non-Commercial Use** | Yes | Yes |
**Commercial Use** | No | Yes |
**Supported Platforms** | Ubuntu (x86_64) | Linux (x86_64), Mac, Windows (x86_64), iOS, Android, Raspberry Pi, Beagle Bone, and modern Web Browsers.
**Custom Language Models** | No | Yes |
**Compact Language Models** | No | Yes |
**Support** | Community Support | Enterprise Support

## Structure of Repository

Leopard is shipped as an ANSI C shared library. The binary files for supported platforms are located under
[lib](/lib) and header files are at [include](/include). Bindings are available at [binding](/binding) to facilitate
usage from higher-level languages/platforms. Demo applications are at [demo](/demo). When possible, use one of the demo
applications as a starting point for your own implementation. Finally, [resources](/resources) is a placeholder for
data used by various applications within the repository.

## Running Demo Applications

### Python Demo Application

The demo transcribes a set of audio files provided as command line arguments. The demo has been tested using Python 3.6.
Note that the files need to be single-channel, 16KHz, and 16-bit linearly-encoded. For more information about audio
requirements refer to [pv_leopard.h](/include/pv_leopard.h). The following transcribes the WAV file located in the
resource directory.

```bash
python demo/python/leopard_demo.py --audio_paths resources/audio_samples/test.wav
```

In order to transcribe multiple files concatenate their paths using comma as below.

```bash
python demo/python/leopard_demo.py --audio_paths PATH_TO_AUDIO_FILE_1,PATH_TO_AUDIO_FILE_2,PATH_TO_AUDIO_FILE_3
```

### C Demo Application

This demo application accepts a set of WAV files as input and returns their transcripts. Note that the demo expects the
audio files to be WAV, 16KHz, and 16-bit linearly-encoded. It does not perform any verification to assure the
compatibility or correctness of the input audio files. Set the current working directory to the root of the repository.
The demo can be built using `gcc` as below.

```bash
gcc -I include/ -O3 demo/c/leopard_demo.c -ldl -o leopard_demo
```

The usage can be attained by

```bash
./leopard_demo
```

Then it can be used as follows

```bash
./leopard_demo \
./lib/linux/x86_64/libpv_leopard.so \
./lib/common/acoustic_model.pv \
./lib/common/language_model.pv \
./resources/license/leopard_eval_linux.lic \
./resources/audio_samples/test.wav
```

In order to transcribe multiple files, append the absolute path to each additional file to the list of command line
arguments as follows:

```bash
./leopard_demo \
./lib/linux/x86_64/libpv_leopard.so \
./lib/common/acoustic_model.pv \
./lib/common/language_model.pv \
./resources/license/leopard_eval_linux.lic \
PATH_TO_AUDIO_FILE_1 PATH_TO_AUDIO_FILE_2 PATH_TO_AUDIO_FILE_3
```

## Integration

### Python

[leopard.py](/binding/python/leopard.py) provides a Python binding for Leopard library. Below is a quick demonstration
of how to construct an instance of it.

```python
library_path = ... # The file is available under lib/linux/x86_64/libpv_leopard.so
acoustic_model_path = ... # The file is available under lib/common/acoustic_model.pv
language_model_path = ... # The file is available under lib/common/language_model.pv
license_path = ... # The file is available under resources/license/leopard_eval_linux.lic

handle = Leopard(library_path, acoustic_model_path, language_model_path, license_path)
```

When initialized, valid sample rate can be obtained using `handle.sample_rate`.

```python
audio = ... # audio data to be transcribed

transcript = handle.process(audio)
```

When finished, release the acquired resources.

```python
handle.delete()
```

### C

Leopard is implemented in ANSI C and therefore can be directly linked to C applications.
[pv_leopard.h](/include/pv_leopard.h) header file contains relevant information. An instance of Leopard object can be
constructed as follows.

```c
const char *acoustic_model_path = ... // The file is available under lib/common/acoustic_model.pv
const char *language_model_path = ... // The file is available under lib/common/language_model.pv
const char *license_path = ... // The file is available under resources/license/leopard_eval_linux.lic

pv_leopard_t *handle;
const pv_status_t status = pv_leopard_init(
    acoustic_model_path,
    language_model_path,
    license_path,
    &handle);
if (status != PV_STATUS_SUCCESS) {
    // error handling logic
}
```

Now the `handle` can be used to process audio. Leopard accepts single-channel 16-bit PCM audio.
The sample rate can be retrieved using `pv_sample_rate()`.

```C
const int16_t *audio = ... // audio data to be transcribed
const int audio_length = ... // number of samples in audio

char *transcript;
const pv_status_t status = pv_leopard_process(handle, audio, audio_length, &transcript);
if (status != PV_STATUS_SUCCESS) {
    // error handling logic
}

free(transcript);
```

Finally, when done be sure to release resources acquired.

```C
pv_leopard_delete(handle);
```

## Releases

### V1.0.0 — January 14th, 2020

* Initial release.
