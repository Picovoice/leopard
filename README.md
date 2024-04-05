# Leopard

[![GitHub release](https://img.shields.io/github/release/Picovoice/Leopard.svg)](https://github.com/Picovoice/Leopard/releases)
[![GitHub](https://img.shields.io/github/license/Picovoice/leopard)](https://github.com/Picovoice/leopard/)
[![GitHub language count](https://img.shields.io/github/languages/count/Picovoice/leopard)](https://github.com/Picovoice/leopard/)

[![Crates.io](https://img.shields.io/crates/v/pv_leopard)](https://crates.io/crates/pv_leopard)<!-- markdown-link-check-disable-line -->
[![Maven Central](https://img.shields.io/maven-central/v/ai.picovoice/leopard-android?label=maven-central%20%5Bandroid%5D)](https://repo1.maven.org/maven2/ai/picovoice/leopard-android/)
[![Maven Central](https://img.shields.io/maven-central/v/ai.picovoice/leopard-java?label=maven%20central%20%5Bjava%5D)](https://repo1.maven.org/maven2/ai/picovoice/leopard-java/)
[![npm](https://img.shields.io/npm/v/@picovoice/leopard-node?label=npm%20%5Bnode%5D)](https://www.npmjs.com/package/@picovoice/picovoice-node)
[![npm](https://img.shields.io/npm/v/@picovoice/leopard-react?label=npm%20%5Breact%5D)](https://www.npmjs.com/package/@picovoice/leopard-react)
[![npm](https://img.shields.io/npm/v/@picovoice/leopard-react-native?label=npm%20%5Breact-native%5D)](https://www.npmjs.com/package/@picovoice/leopard-react-native)
[![npm](https://img.shields.io/npm/v/@picovoice/leopard-web?label=npm%20%5Bweb%5D)](https://www.npmjs.com/package/@picovoice/leopard-web)
[![Nuget](https://img.shields.io/nuget/v/leopard)](https://www.nuget.org/packages/Leopard/)
[![npm](https://img.shields.io/cocoapods/v/Leopard-iOS)](https://cocoapods.org/pods/Leopard-iOS)
[![Pub Version](https://img.shields.io/pub/v/leopard_flutter)](https://pub.dev/packages/leopard_flutter)
[![PyPI](https://img.shields.io/pypi/v/pvleopard)](https://pypi.org/project/pvleopard/)
[![Go Reference](https://pkg.go.dev/badge/github.com/Picovoice/leopard/binding/go.svg)](https://pkg.go.dev/github.com/Picovoice/leopard/binding/go)

Made in Vancouver, Canada by [Picovoice](https://picovoice.ai)

[![Twitter URL](https://img.shields.io/twitter/url?label=%40AiPicovoice&style=social&url=https%3A%2F%2Ftwitter.com%2FAiPicovoice)](https://twitter.com/AiPicovoice)<!-- markdown-link-check-disable-line -->
[![YouTube Channel Views](https://img.shields.io/youtube/channel/views/UCAdi9sTCXLosG1XeqDwLx7w?label=YouTube&style=social)](https://www.youtube.com/channel/UCAdi9sTCXLosG1XeqDwLx7w)

Leopard is an on-device speech-to-text engine. Leopard is:

- Private; All voice processing runs locally.
- [Accurate](https://picovoice.ai/docs/benchmark/stt/)
- [Compact and Computationally-Efficient](https://github.com/Picovoice/speech-to-text-benchmark#rtf)
- Cross-Platform:
  - Linux (x86_64), macOS (x86_64, arm64), Windows (x86_64)
  - Android and iOS
  - Chrome, Safari, Firefox, and Edge
  - Raspberry Pi (3, 4, 5) and NVIDIA Jetson Nano

## Table of Contents

- [Leopard](#leopard)
    - [Table of Contents](#table-of-contents)
    - [AccessKey](#accesskey)
    - [Language Support](#language-support)
    - [Demos](#demos)
        - [Python](#python-demos)
        - [C](#c-demo)
        - [iOS](#ios-demo)
        - [Android](#android-demo)
        - [Node.js](#nodejs-demo)
        - [Flutter](#flutter-demo)
        - [Go](#go-demo)
        - [React Native](#react-native-demo)
        - [Java](#java-demo)
        - [.NET](#net-demo)
        - [Rust](#rust-demo)
        - [Web](#web-demos)
          - [Vanilla JavaScript and HTML](#vanilla-javascript-and-html)
          - [React](#react-demo)
    - [SDKs](#sdks)
        - [Python](#python)
        - [C](#c)
        - [iOS](#ios)
        - [Android](#android)
        - [Node.js](#nodejs)
        - [Flutter](#flutter)
        - [Go](#go)
        - [React Native](#react-native)
        - [Java](#java)
        - [.NET](#net)
        - [Rust](#rust)
        - [Web](#web)
          - [Vanilla JavaScript and HTML (ES Modules)](#vanilla-javascript-and-html-es-modules)
          - [React](#react)
    - [Releases](#releases)

## AccessKey

AccessKey is your authentication and authorization token for deploying Picovoice SDKs, including Leopard. Anyone who is
using Picovoice needs to have a valid AccessKey. You must keep your AccessKey secret. You would need internet
connectivity to validate your AccessKey with Picovoice license servers even though the voice recognition is running 100%
offline.

AccessKey also verifies that your usage is within the limits of your account. Everyone who signs up for
[Picovoice Console](https://console.picovoice.ai/) receives the `Free Tier` usage rights described
[here](https://picovoice.ai/pricing/). If you wish to increase your limits, you can purchase a subscription plan.

## Language Support

- English, French, German, Italian, Japanese, Korean, Portuguese, and Spanish.
- Support for [additional languages is available for commercial customers](https://picovoice.ai/consulting/) on a case-by-case basis.

## Demos

### Python Demos

Install the demo package:

```console
pip3 install pvleoparddemo
```

Run the following in the terminal:

```bash
leopard_demo_file --access_key ${ACCESS_KEY} --audio_paths ${AUDIO_FILE_PATH}
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console and `${AUDIO_FILE_PATH}` with a path to an audio file you
wish to transcribe.

### C Demo

Build the demo:

```console
cmake -S demo/c/ -B demo/c/build && cmake --build demo/c/build
```

Run the demo:

```console
./demo/c/build/leopard_demo -a ${ACCESS_KEY} -l ${LIBRARY_PATH} -m ${MODEL_FILE_PATH} ${AUDIO_FILE_PATH}
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console, `${LIBRARY_PATH}` with the path to appropriate
library under [lib](/lib), `${MODEL_FILE_PATH}` to path to [default model file](./lib/common/leopard_params.pv)
(or your custom one), and `${AUDIO_FILE_PATH}` with a path to an audio file you wish to transcribe.

### iOS Demo

To run the demo, go to [demo/ios/LeopardDemo](./demo/ios/LeopardDemo) and run:

```console
pod install
```

Replace `let accessKey = "${YOUR_ACCESS_KEY_HERE}"` in the file [ViewModel.swift](./demo/ios/LeopardDemo/LeopardDemo/ViewModel.swift) with your `AccessKey`.

Then, using [Xcode](https://developer.apple.com/xcode/), open the generated `LeopardDemo.xcworkspace` and run the application.

### Android Demo

Using Android Studio, open [demo/android/LeopardDemo](./demo/android/LeopardDemo) as an Android project and then run the application.

Replace `"${YOUR_ACCESS_KEY_HERE}"` in the file [MainActivity.java](./demo/android/LeopardDemo/leopard-demo-app/src/main/java/ai/picovoice/leoparddemo/MainActivity.java) with your `AccessKey`.

### Node.js Demo

Install the demo package:

```console
yarn global add @picovoice/leopard-node-demo
```

Run the following in the terminal:

```console
leopard-file-demo --access_key ${ACCESS_KEY} --input_audio_file_path ${AUDIO_FILE_PATH}
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console and `${AUDIO_FILE_PATH}` with a path to an audio file you
wish to transcribe.

For more information about Node.js demos go to [demo/nodejs](./demo/nodejs).

### Flutter Demo

To run the Leopard demo on Android or iOS with Flutter, you must have the [Flutter SDK](https://flutter.dev/docs/get-started/install) installed on your system. Once installed, you can run `flutter doctor` to determine any other missing requirements for your relevant platform. Once your environment has been set up, launch a simulator or connect an Android/iOS device.

Run the `prepare_demo` script from [demo/flutter](.) with a language code to set up the demo in the language of your choice (e.g. `de` -> German, `ko` -> Korean). To see a list of available languages, run `prepare_demo` without a language code.

```console
dart scripts/prepare_demo.dart ${LANGUAGE}
```

Replace `"${YOUR_ACCESS_KEY_HERE}"` in the file [main.dart](./demo/flutter/lib/main.dart) with your `AccessKey`.

Run the following command from [demo/flutter](./demo/flutter) to build and deploy the demo to your device:

```console
flutter run
```

### Go Demo

The demo requires `cgo`, which on Windows may mean that you need to install a gcc compiler like [Mingw](https://www.mingw-w64.org/) to build it properly.

From [demo/go](./demo/go) run the following command from the terminal to build and run the file demo:

```console
go run filedemo/leopard_file_demo.go -access_key "${ACCESS_KEY}" -input_audio_path "${AUDIO_FILE_PATH}"
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console and `${AUDIO_FILE_PATH}` with a path to an audio file you wish to transcribe.

For more information about Go demos go to [demo/go](./demo/go).

### React Native Demo

To run the React Native Leopard demo app you will first need to set up your React Native environment. For this,
please refer to [React Native's documentation](https://reactnative.dev/docs/environment-setup). Once your environment has
been set up, navigate to [demo/react-native](./demo/react-native) to run the following commands:

For Android:

```console
yarn android-install    # sets up environment
yarn android-run        # builds and deploys to Android
```

For iOS:

```console
yarn ios-install        # sets up environment
yarn ios-run
```

### Java Demo

The [Leopard Java demo](./demo/java) is a command-line application that lets you choose between running Leopard on an audio file or on microphone input.

From [demo/java](./demo/java) run the following commands from the terminal to build and run the file demo:

```console
cd demo/java
./gradlew build
cd build/libs
java -jar leopard-file-demo.jar -a ${ACCESS_KEY} -i ${AUDIO_FILE_PATH}
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console and `${AUDIO_FILE_PATH}` with a path to an audio file you wish to transcribe.

For more information about Java demos go to [demo/java](./demo/java).

### .NET Demo

[Leopard .NET demo](./demo/dotnet) is a command-line application that lets you choose between running Leopard on an audio
file or on real-time microphone input.

From [demo/dotnet/LeopardDemo](./demo/dotnet/LeopardDemo) run the following in the terminal:

```console
dotnet run -c FileDemo.Release -- --access_key ${ACCESS_KEY} --input_audio_path ${AUDIO_FILE_PATH}
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console and `${AUDIO_FILE_PATH}` with a path to an audio file you
wish to transcribe.

For more information about .NET demos, go to [demo/dotnet](./demo/dotnet).

### Rust Demo

[Leopard Rust demo](./demo/rust) is a command-line application that lets you choose between running Leopard on an audio
file or on real-time microphone input.

From [demo/rust/filedemo](./demo/rust/filedemo) run the following in the terminal:

```console
cargo run --release -- --access_key ${ACCESS_KEY} --input_audio_path ${AUDIO_FILE_PATH}
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console and `${AUDIO_FILE_PATH}` with a path to an audio file you
wish to transcribe.

For more information about Rust demos, go to [demo/rust](./demo/rust).

### Web Demos

#### Vanilla JavaScript and HTML

From [demo/web](./demo/web) run the following in the terminal:

```console
yarn
yarn start
```

(or)

```console
npm install
npm run start
```

Open `http://localhost:5000` in your browser to try the demo.

#### React Demo

From [demo/react](demo/react) run the following in the terminal:

```console
yarn
yarn start ${LANGUAGE}
```

(or)

```console
npm install
npm run start ${LANGUAGE}
```

Open `http://localhost:3000` in your browser to try the demo.

## SDKs

### Python

Install the Python SDK:

```console
pip3 install pvleopard
```

Create an instance of the engine and transcribe an audio file:

```python
import pvleopard

leopard = pvleopard.create(access_key='${ACCESS_KEY}')

print(leopard.process_file('${AUDIO_FILE_PATH}'))
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console](https://console.picovoice.ai/) and
`${AUDIO_FILE_PATH}` to path an audio file. Finally, when done be sure to explicitly release the resources using
`leopard.delete()`.

### C

Create an instance of the engine and transcribe an audio file:

```c
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

#include "pv_leopard.h"

pv_leopard_t *leopard = NULL;
bool enable_automatic_punctuation = false;
bool enable_speaker_diarization = false;

pv_status_t status = pv_leopard_init(
  "${ACCESS_KEY}",
  "${MODEL_FILE_PATH}",
  enable_automatic_punctuation,
  enable_speaker_diarization,
  &leopard);
if (status != PV_STATUS_SUCCESS) {
    // error handling logic
}

char *transcript = NULL;
int32_t num_words = 0;
pv_word_t *words = NULL;
status = pv_leopard_process_file(
    leopard,
    "${AUDIO_FILE_PATH}",
    &transcript,
    &num_words,
    &words);
if (status != PV_STATUS_SUCCESS) {
    // error handling logic
}

fprintf(stdout, "%s\n", transcript);
for (int32_t i = 0; i < num_words; i++) {
    fprintf(
            stdout,
            "[%s]\t.start_sec = %.1f .end_sec = %.1f .confidence = %.2f .speaker_tag = %d\n",
            words[i].word,
            words[i].start_sec,
            words[i].end_sec,
            words[i].confidence,
            words[i].speaker_tag);
}

pv_leopard_transcript_delete(transcript);
pv_leopard_words_delete(words);
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console, `${MODEL_FILE_PATH}` to path to
[default model file](./lib/common/leopard_params.pv) (or your custom one), and `${AUDIO_FILE_PATH}` to path an audio file.
Finally, when done be sure to release resources acquired using `pv_leopard_delete(leopard)`.

### iOS
<!-- markdown-link-check-disable -->
The Leopard iOS binding is available via [CocoaPods](https://cocoapods.org/pods/Leopard-iOS). To import it into your iOS project, add the following line to your Podfile and run `pod install`:
<!-- markdown-link-check-enable -->
```ruby
pod 'Leopard-iOS'
```

Create an instance of the engine and transcribe an audio_file:

```swift
import Leopard

let modelPath = Bundle(for: type(of: self)).path(
        forResource: "${MODEL_FILE}", // Name of the model file name for Leopard
        ofType: "pv")!

let leopard = Leopard(accessKey: "${ACCESS_KEY}", modelPath: modelPath)

do {
    let audioPath = Bundle(for: type(of: self)).path(forResource: "${AUDIO_FILE_NAME}", ofType: "${AUDIO_FILE_EXTENSION}")
    let result = leopard.process(audioPath)
    print(result.transcript)
} catch let error as LeopardError {
} catch { }
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console, `${MODEL_FILE}` a custom trained model from [console](https://console.picovoice.ai/) or the [default model](./lib/common/leopard_params.pv), `${AUDIO_FILE_NAME}` with the name of the audio file and `${AUDIO_FILE_EXTENSION}` with the extension of the audio file.

### Android

To include the package in your Android project, ensure you have included `mavenCentral()` in your top-level `build.gradle` file and then add the following to your app's `build.gradle`:

```groovy
dependencies {
    implementation 'ai.picovoice:leopard-android:${LATEST_VERSION}'
}
```

Create an instance of the engine and transcribe an audio file:

```java
import ai.picovoice.leopard.*;

final String accessKey = "${ACCESS_KEY}"; // AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)
final String modelPath = "${MODEL_FILE_PATH}";
try {
    Leopard leopard = new Leopard.Builder()
        .setAccessKey(accessKey)
        .setModelPath(modelPath)
        .build(appContext);

    File audioFile = new File("${AUDIO_FILE_PATH}");
    LeopardTranscript transcript = leopard.processFile(audioFile.getAbsolutePath());

} catch (LeopardException ex) { }
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console, `${MODEL_FILE_PATH}` with a custom trained model from [console](https://console.picovoice.ai/) or the [default model](./lib/common/leopard_params.pv), and `${AUDIO_FILE_PATH}` with the path to the audio file.

### Node.js

Install the Node.js SDK:

```console
yarn add @picovoice/leopard-node
```

Create instances of the Leopard class:

```javascript
const Leopard = require("@picovoice/leopard-node");
const accessKey = "${ACCESS_KEY}" // Obtained from the Picovoice Console (https://console.picovoice.ai/)
let leopard = new Leopard(accessKey);

const result = engineInstance.processFile('${AUDIO_FILE_PATH}');
console.log(result.transcript);
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console](https://console.picovoice.ai/) and
`${AUDIO_FILE_PATH}` to path an audio file.

When done, be sure to release resources using `release()`:

```javascript
leopard.release();
```

### Flutter

Add the [Leopard Flutter plugin](https://pub.dev/packages/leopard_flutter) to your pub.yaml.

```yaml
dependencies:
  leopard_flutter: ^<version>
```

Create an instance of the engine and transcribe an audio file:

```dart
import 'package:leopard/leopard.dart';

final String accessKey = '{ACCESS_KEY}'  // AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)

try {
    Leopard _leopard = await Leopard.create(accessKey, '{MODEL_FILE_PATH}');
    LeopardTranscript result = await _leopard.processFile("${AUDIO_FILE_PATH}");
    print(result.transcript);
} on LeopardException catch (err) { }
```

Replace `${ACCESS_KEY}` with your `AccessKey` obtained from [Picovoice Console](https://console.picovoice.ai/), `${MODEL_FILE_PATH}` with a custom trained model from [Picovoice Console](https://console.picovoice.ai/) or the [default model](./lib/common/leopard_params.pv), and `${AUDIO_FILE_PATH}` with the path to the audio file.

### Go

Install the Go binding:

```console
go get github.com/Picovoice/leopard/binding/go/v2
```

Create an instance of the engine and transcribe an audio file:

```go
import . "github.com/Picovoice/leopard/binding/go/v2"

leopard = Leopard{AccessKey: "${ACCESS_KEY}"}
err := leopard.Init()
if err != nil {
    // handle err init
}
defer leopard.Delete()

transcript, words, err := leopard.ProcessFile("${AUDIO_FILE_PATH}")
if err != nil {
    // handle process error
}

log.Println(transcript)
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console](https://console.picovoice.ai/) and
`${AUDIO_FILE_PATH}` to path an audio file. Finally, when done be sure to explicitly release the resources using
`leopard.Delete()`.

### React Native

The Leopard React Native binding is available via [NPM](https://www.npmjs.com/package/@picovoice/leopard-react-native). Add it via the following command:

```console
yarn add @picovoice/leopard-react-native
```

Create an instance of the engine and transcribe an audio file:

```typescript
import {Leopard, LeopardErrors} from '@picovoice/leopard-react-native';

const getAudioFrame = () => {
  // get audio frames
}

try {
  const leopard = await Leopard.create("${ACCESS_KEY}", "${MODEL_FILE_PATH}")
  const { transcript, words } = await leopard.processFile("${AUDIO_FILE_PATH}")
  console.log(transcript)
} catch (err: any) {
  if (err instanceof LeopardErrors) {
    // handle error
  }
}
```

Replace `${ACCESS_KEY}` with your `AccessKey` obtained from Picovoice Console, `${MODEL_FILE_PATH}` with a custom trained model from [Picovoice Console](https://console.picovoice.ai/) or the [default model](./lib/common/leopard_params.pv) and `${AUDIO_FILE_PATH}` with the absolute path of the audio file.
When done be sure to explicitly release the resources using `leopard.delete()`.

### Java

The latest Java bindings are available from the Maven Central Repository at:

```console
ai.picovoice:leopard-java:${version}
```

Create an instance of the engine with the Leopard Builder class and transcribe an audio file:

```java
import ai.picovoice.leopard.*;

final String accessKey = "${ACCESS_KEY}";

try {
    Leopard leopard = new Leopard.Builder().setAccessKey(accessKey).build();
    LeopardTranscript result = leopard.processFile("${AUDIO_FILE_PATH}");
    leopard.delete();
} catch (LeopardException ex) { }

System.out.println(result.getTranscriptString());
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console](https://console.picovoice.ai/) and `${AUDIO_FILE_PATH}` to the path an audio file. Finally, when done be sure to explicitly release the resources using `leopard.delete()`.

### .NET

Install the .NET SDK using NuGet or the dotnet CLI:

```console
dotnet add package Leopard
```

Create an instance of the engine and transcribe an audio file:

```csharp
using Pv;

const string accessKey = "${ACCESS_KEY}";
const string audioPath = "${AUDIO_FILE_PATH}";

Leopard leopard = Leopard.Create(accessKey);

Console.Write(leopard.ProcessFile(audioPath));
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console](https://console.picovoice.ai/). Finally, when done release the resources using `leopard.Dispose()`.

### Rust

First you will need [Rust and Cargo](https://rustup.rs/) installed on your system.

To add the leopard library into your app, add `pv_leopard` to your app's `Cargo.toml` manifest:
```toml
[dependencies]
pv_leopard = "*"
```

Create an instance of the engine using `LeopardBuilder` instance and transcribe an audio file:

```rust
use leopard::LeopardBuilder;

fn main() {
    let access_key = "${ACCESS_KEY}"; // AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)
    let leopard: Leopard = LeopardBuilder::new().access_key(access_key).init().expect("Unable to create Leopard");

    if let Ok(leopard_transcript) = leopard.process_file("/absolute/path/to/audio_file") {
        println!("{}", leopard_transcript.transcript);
    }
}
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console](https://console.picovoice.ai/).

### Web

#### Vanilla JavaScript and HTML (ES Modules)

Install the web SDK using yarn:

```console
yarn add @picovoice/leopard-web
```

or using npm:

```console
npm install --save @picovoice/leopard-web
```

Create an instance of the engine using `LeopardWorker` and transcribe an audio file:

```typescript
import { Leopard } from "@picovoice/leopard-web";
import leopardParams from "${PATH_TO_BASE64_LEOPARD_PARAMS}";

function getAudioData(): Int16Array {
  // ... function to get audio data
  return new Int16Array();
}

const leopard = await LeopardWorker.create(
  "${ACCESS_KEY}",
  { base64: leopardParams },
);

const { transcript, words } = await leopard.process(getAudioData());
console.log(transcript);
console.log(words);
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console](https://console.picovoice.ai/). Finally, when done release the resources using `leopard.release()`.

#### React

```console
yarn add @picovoice/leopard-react @picovoice/web-voice-processor
```

(or)

```console
npm install @picovoice/leopard-react @picovoice/web-voice-processor
```

```typescript
import { useLeopard } from "@picovoice/leopard-react";

function App(props) {
  const {
    result,
    isLoaded,
    error,
    init,
    processFile,
    startRecording,
    stopRecording,
    isRecording,
    recordingElapsedSec,
    release,
  } = useLeopard();

  const initEngine = async () => {
    await init(
      "${ACCESS_KEY}",
      leopardModel,
    );
  };

  const handleFileUpload = async (audioFile: File) => {
    await processFile(audioFile);
  }

  const toggleRecord = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  useEffect(() => {
    if (result !== null) {
      console.log(result.transcript);
      console.log(result.words);
    }
  }, [result])
}
```

## Releases

### v2.0.0 - November 30th, 2023

- Added speaker diarization feature
- Added React SDK
- Improvements to error reporting
- Upgrades to authorization and authentication system
- Improved engine accuracy
- Various bug fixes and improvements
- Node min support bumped to Node 16
- Bumped iOS support to iOS 13+
- Patches to .NET support

### v1.2.0 - March 27th, 2023

* Added language support for French, German, Italian, Japanese, Korean, Portuguese and Spanish
* Added support for .NET 7.0 and fixed support for .NET Standard 2.0
* iOS minimum support moved to 11.0
* Improved stability and performance

### v1.1.0 - August 11th, 2022

* Added true-casing by default for transcription results
* Added option to enable automatic punctuation insertion
* Word timestamps and confidence returned as part of transcription
* Support for 3gp (AMR) and MP4/m4a (AAC) audio files
* Leopard Web SDK release

### v1.0.0 - January 10th, 2022

* Initial release
