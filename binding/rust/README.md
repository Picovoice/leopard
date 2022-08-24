# Leopard Binding for Rust

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
    - Raspberry Pi (4, 3) and NVIDIA Jetson Nano

## Compatibility

- Rust 1.54+
- Runs on Linux (x86_64), macOS (x86_64, arm64), Windows (x86_64), Raspberry Pi (4, 3), and NVIDIA Jetson Nano.

## Installation

First you will need [Rust and Cargo](https://rustup.rs/) installed on your system.

To add the leopard library into your app, add `pv_leopard` to your apps `Cargo.toml` manifest:
```toml
[dependencies]
pv_leopard = "*"
```

If you prefer to clone the repo and use it locally, first run `copy.sh`.
(**NOTE:** on Windows, Git Bash or another bash shell is required, or you will have to manually copy the libs into the project).
Then you can reference the local binding location:
```toml
[dependencies]
pv_leopard = { path = "/path/to/rust/binding" }
```

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Usage

Create an instance of the engine and transcribe an audio file:

```rust
use leopard::LeopardBuilder;

fn main() {
  let access_key = "${ACCESS_KEY}"; // AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)
  
  let leopard: Leopard = LeopardBuilder::new(access_key).init().expect("Unable to create Leopard");
  if let Ok(leopard_transcript) = leopard.process_file("${AUDIO_PATH}") {
      println!("{}", leopard_transcript.transcript);
  }
}
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console]((https://console.picovoice.ai/)) and
`${AUDIO_PATH}` to the path an audio file.

The model file contains the parameters for the Leopard engine. You may create bespoke language models using [Picovoice Console](https://console.picovoice.ai/) and then pass in the relevant file.

## Demos

The [Leopard Rust demo project](https://github.com/Picovoice/leopard/tree/master/demo/rust) is a Rust console app that allows for processing real-time audio (i.e. microphone) and files using Leopard.
