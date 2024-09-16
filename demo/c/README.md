# C Demo

## Compatibility

- C99-compatible compiler

## Requirements

- [CMake](https://cmake.org/) version 3.13 or higher
- [MinGW](https://mingw-w64.org/) (**Windows Only**)

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Usage

### Build Linux/MacOS

Build the demo by running this from the root of the repository:

```console
cmake -S demo/c/ -B demo/c/build
cmake --build demo/c/build
```

### Build Windows

Build the demo by running this from the root of the repository:

```console
cmake -S demo/c/ -B demo/c/build -G "MinGW Makefiles"
cmake --build demo/c/build
```

### Run

Running the demo without arguments prints the usage:

```console
usage: -a ACCESS_KEY -l LIBRARY_PATH -m MODEL_PATH [-d] [-v] audio_path0 audio_path1 ...
```

Run the command corresponding to your platform from the root of the repository. Replace `${ACCESS_KEY}` with yours
obtained from [Picovoice Console](https://console.picovoice.ai/) and `${AUDIO_FILE_PATH}` with the path to an audio file you
want to transcribe.

Use the `-d` flag to disable automatic punctuation.

Use the `-v` flag to enable the printing of word metadata.


#### Linux (x86_64)

```console
./demo/c/build/leopard_demo \
-a ${ACCESS_KEY} \
-m lib/common/leopard_params.pv \
-l lib/linux/x86_64/libpv_leopard.so \
${AUDIO_FILE_PATH}
```

#### macOS (x86_64)

```console
./demo/c/build/leopard_demo \
-a ${ACCESS_KEY} \
-m lib/common/leopard_params.pv \
-l lib/mac/x86_64/libpv_leopard.dylib \
${AUDIO_FILE_PATH}
```

#### macOS (arm64)

```console
./demo/c/build/leopard_demo \
-a ${ACCESS_KEY} \
-m lib/common/leopard_params.pv \
-l lib/mac/arm64/libpv_leopard.dylib \
${AUDIO_FILE_PATH}
```

#### Windows

Run using `Command Prompt`.

```console
demo\\c\\build\\leopard_demo.exe ^
-a ${ACCESS_KEY} ^
-m lib\\common\\leopard_params.pv ^
-l lib\\windows\\amd64\\libpv_leopard.dll ^
${AUDIO_FILE_PATH}
```

#### Raspberry Pi 5

```console
./demo/c/build/leopard_demo \
-a ${ACCESS_KEY} \
-m lib/common/leopard_params.pv \
-l lib/raspberry-pi/cortex-a76/libpv_leopard.so \
${AUDIO_FILE_PATH}
```

#### Raspberry Pi 5 (64-bit)

```console
./demo/c/build/leopard_demo \
-a ${ACCESS_KEY} \
-m lib/common/leopard_params.pv \
-l lib/raspberry-pi/cortex-a76-aarch64/libpv_leopard.so \
${AUDIO_FILE_PATH}
```

#### Raspberry Pi 4

```console
./demo/c/build/leopard_demo \
-a ${ACCESS_KEY} \
-m lib/common/leopard_params.pv \
-l lib/raspberry-pi/cortex-a72/libpv_leopard.so \
${AUDIO_FILE_PATH}
```

#### Raspberry Pi 4 (64-bit)

```console
./demo/c/build/leopard_demo \
-a ${ACCESS_KEY} \
-m lib/common/leopard_params.pv \
-l lib/raspberry-pi/cortex-a72-aarch64/libpv_leopard.so \
${AUDIO_FILE_PATH}
```

#### Raspberry Pi 3

```console
./demo/c/build/leopard_demo \
-a ${ACCESS_KEY} \
-m lib/common/leopard_params.pv \
-l lib/raspberry-pi/cortex-a53/libpv_leopard.so \
${AUDIO_FILE_PATH}
```

#### Raspberry Pi 3 (64-bit)

```console
./demo/c/build/leopard_demo \
-a ${ACCESS_KEY} \
-m lib/common/leopard_params.pv \
-l lib/raspberry-pi/cortex-a53-aarch64/libpv_leopard.so \
${AUDIO_FILE_PATH}
```
