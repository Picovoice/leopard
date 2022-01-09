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

AccessKey is your authentication and authorization token for deploying Picovoice SDKs, including Leopard. Anyone who is
using Picovoice  needs to have a valid AccessKey. YOU MUST KEEP YOUR AccessKey SECRET! You do need internet connectivity
to validate your AccessKey with Picovoice license servers even though the voice recognition is running 100% offline.

AccessKey also verifies that your usage is within the limits of your account. Everyone who signs up for
[Picovoice Console](https://console.picovoice.ai/) receives the `Free Tier` usage rights as described on
[here](https://picovoice.ai/pricing/). If you wish to increase your limits, you can purchase a subscription plan.

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

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console and `${AUDIO_PATH}` with a path to an audio file you
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
(or your custom one), and `${AUDIO_PATH}` with a path to an audio file you wish to transcribe.

## SDKs

### Python

Install the Python SDK:

```console
pip3 install pvleopard
```

Create an instance of the engine and transcribe an audio file:

```python
import pvleopard

handle = pvleopard.create(access_key='${ACCESS_KEY}')

print(handle.process_file('${AUDIO_PATH}'))
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console]((https://console.picovoice.ai/)) and
`${AUDIO_PATH}` to path an audio file. Finally, when done be sure to explicitly release the resources using
`handle.delete()`.

### C

Create an instance of the engine and transcribe an audio file:

```c
#include <stdio.h>

#include "pv_leopard.h"

pv_leopard_t *handle = NULL;
pv_status_t status = pv_leopard_init('${ACCESS_KEY}', '${MODEL_PATH}', &handle);
if (status != PV_STATUS_SUCCESS) {
    // error handling logic
}

char *transcript = NULL;
status = pv_leopard_process_file(handle, '${AUDIO_PATH}', &transcript)
if (status != PV_STATUS_SUCCESS) {
    // error handling logic
}

fprintf(stdout, "%s\n", transcript);
free(transcript);
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console, `${MODEL_PATH}` to path to
[default model file](/lib/common/leopard_params.pv) (or your custom one), and `${AUDIO_PATH}` to path an audio file.
Finally, when done be sure to release resources acquired using `pv_leopard_delete(handle)`.

## Releases

### V1.0.0 — January 14th, 2022

* Initial release.
