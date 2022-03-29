# Leopard

Made in Vancouver, Canada by [Picovoice](https://picovoice.ai)

[![Twitter URL](https://img.shields.io/twitter/url?label=%40AiPicovoice&style=social&url=https%3A%2F%2Ftwitter.com%2FAiPicovoice)](https://twitter.com/AiPicovoice)
[![YouTube Channel Views](https://img.shields.io/youtube/channel/views/UCAdi9sTCXLosG1XeqDwLx7w?label=YouTube&style=social)](https://www.youtube.com/channel/UCAdi9sTCXLosG1XeqDwLx7w)

Leopard is an on-device speech-to-text engine. Leopard is:

- Private; All voice processing runs locally.
- Accurate [[1]](https://github.com/Picovoice/speech-to-text-benchmark#results)
- Compact and Computationally-Efficient [[2]](https://github.com/Picovoice/speech-to-text-benchmark#rtf)
- Cross-Platform:
    - Linux (x86_64)
    - macOS (x86_64, arm64)
    - Windows (x86_64)
    - Android
    - iOS
    - Raspberry Pi (4, 3)
    - NVIDIA Jetson Nano

## Table of Contents

- [Leopard](#leopard)
    - [Table of Contents](#table-of-contents)
    - [AccessKey](#accesskey)
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
    - [Releases](#releases)

## AccessKey

AccessKey is your authentication and authorization token for deploying Picovoice SDKs, including Leopard. Anyone who is
using Picovoice needs to have a valid AccessKey. You must keep your AccessKey secret. You would need internet
connectivity to validate your AccessKey with Picovoice license servers even though the voice recognition is running 100%
offline.

AccessKey also verifies that your usage is within the limits of your account. Everyone who signs up for
[Picovoice Console](https://console.picovoice.ai/) receives the `Free Tier` usage rights described
[here](https://picovoice.ai/pricing/). If you wish to increase your limits, you can purchase a subscription plan.

## Demos

### Python Demos

Install the demo package:

```console
pip3 install pvleoparddemo
```

Run the following in the terminal:

```bash
leopard_demo_file --access_key ${ACCESS_KEY} --audio_paths ${AUDIO_PATH}
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

### iOS Demo

To run the demo, go to [demo/ios/LeopardDemo](/demo/ios/LeopardDemo) and run:

```console
pod install
```

Replace `let accessKey = "${YOUR_ACCESS_KEY_HERE}"` in the file [ViewModel.swift](/demo/ios/LeopardDemo/LeopardDemo/ViewModel.swift) with your `AccessKey`.

Then, using [Xcode](https://developer.apple.com/xcode/), open the generated `LeopardDemo.xcworkspace` and run the application.

### Android Demo

Using Android Studio, open [demo/android/LeopardDemo](/demo/android/LeopardDemo) as an Android project and then run the application.

Replace `"${YOUR_ACCESS_KEY_HERE}"` in the file [MainActivity.java](/demo/android/leopard-demo-app/src/main/java/ai/picovoice/leoparddemo/MainActivity.java) with your `AccessKey`.

### Node.js Demo

Install the demo package:

```console
yarn global add @picovoice/leopard-node-demo
```

Run the following in the terminal:

```console
leopard-file-demo --access_key ${ACCESS_KEY} --input_audio_file_path ${AUDIO_PATH}
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console and `${AUDIO_PATH}` with a path to an audio file you
wish to transcribe.

For more information about Node.js demos go to [demo/nodejs](/demo/nodejs).

### Flutter Demo

To run the Leopard demo on Android or iOS with Flutter, you must have the [Flutter SDK](https://flutter.dev/docs/get-started/install) installed on your system. Once installed, you can run `flutter doctor` to determine any other missing requirements for your relevant platform. Once your environment has been set up, launch a simulator or connect an Android/iOS device.

Before launching the app, use the [copy_assets.sh](/demo/flutter/copy_assets.sh) script to copy the cheetah demo model file into the demo project. (**NOTE**: on Windows, Git Bash or another bash shell is required, or you will have to manually copy the context into the project).

Replace `"${YOUR_ACCESS_KEY_HERE}"` in the file [main.dart](/demo/flutter/lib/main.dart) with your `AccessKey`.

Run the following command from [demo/flutter](/demo/flutter) to build and deploy the demo to your device:

```console
flutter run
```

### Go Demo

The demo requires `cgo`, which on Windows may mean that you need to install a gcc compiler like [Mingw](http://mingw-w64.org/doku.php) to build it properly.

From [demo/go](/demo/go) run the following command from the terminal to build and run the file demo:

```console
go run filedemo/leopard_file_demo.go -access_key "${ACCESS_KEY}" -input_audio_path "${AUDIO_PATH}"
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console and `${AUDIO_PATH}` with a path to an audio file you wish to transcribe.

For more information about Go demos go to [demo/go](/demo/go).

### React Native Demo

To run the React Native Porcupine demo app you will first need to set up your React Native environment. For this,
please refer to [React Native's documentation](https://reactnative.dev/docs/environment-setup). Once your environment has
been set up, navigate to [demo/react-native](/demo/react-native) to run the following commands:

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

The [Leopard Java demo](/demo/java) is a command-line application that lets you choose between running Leopard on an audio file or on microphone input.

From [demo/java](/demo/java) run the following commands from the terminal to build and run the file demo:

```console
cd demo/java
./gradlew build
cd build/libs
java -jar leopard-file-demo.jar -a ${ACCESS_KEY} -i ${AUDIO_PATH}
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console and `${AUDIO_PATH}` with a path to an audio file you wish to transcribe.

For more information about Java demos go to [demo/java](/demo/java).

### .NET Demo

[Leopard .NET demo](/demo/dotnet) is a command-line application that lets you choose between running Leopard on an audio
file or on real-time microphone input.

From [demo/dotnet/LeopardDemo](/demo/dotnet/LeopardDemo) run the following in the terminal:

```console
dotnet run -c FileDemo.Release -- --access_key ${ACCESS_KEY} --input_audio_path ${AUDIO_PATH}
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console and `${AUDIO_PATH}` with a path to an audio file you
wish to transcribe.

For more information about .NET demos, go to [demo/dotnet](/demo/dotnet).

### Rust Demo

[Leopard Rustdemo](/demo/rust) is a command-line application that lets you choose between running Leopard on an audio
file or on real-time microphone input.

From [demo/rust/filedemo](/demo/rust/filedemo) run the following in the terminal:

```console
carogu run --release -- --access_key ${ACCESS_KEY} --input_audio_path ${AUDIO_PATH}
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console and `${AUDIO_PATH}` with a path to an audio file you
wish to transcribe.

For more information about Rust demos, go to [demo/rust](/demo/rust).

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
#include <stdlib.h>

#include "pv_leopard.h"

pv_leopard_t *handle = NULL;
pv_status_t status = pv_leopard_init("${ACCESS_KEY}", "${MODEL_PATH}", &handle);
if (status != PV_STATUS_SUCCESS) {
    // error handling logic
}

char *transcript = NULL;
status = pv_leopard_process_file(handle, "${AUDIO_PATH}", &transcript);
if (status != PV_STATUS_SUCCESS) {
    // error handling logic
}

fprintf(stdout, "%s\n", transcript);
free(transcript);
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console, `${MODEL_PATH}` to path to
[default model file](/lib/common/leopard_params.pv) (or your custom one), and `${AUDIO_PATH}` to path an audio file.
Finally, when done be sure to release resources acquired using `pv_leopard_delete(handle)`.

### iOS

The Leopard iOS binding is available via [CocoaPods](https://cocoapods.org/pods/Leopard-iOS). To import it into your iOS project, add the following line to your Podfile and run `pod install`:

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
    print(leopard.process(audioPath))
} catch let error as LeopardError {
} catch { }
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console, `${MODEL_FILE}` with the default or custom trained model from [console](https://console.picovoice.ai/), `${AUDIO_FILE_NAME}` with the name of the audio file and `${AUDIO_FILE_EXTENSION}` with the extension of the audio file.

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
final String modelPath = "${MODEL_FILE}";
try {
    Leopard handle = new Leopard.Builder().setAccessKey(accessKey).setModelPath(modelPath).build(appContext);

    File audioFile = new File("${AUDIO_FILE_PATH}");
    String transcript = handle.processFile(audioFile.getAbsolutePath());

} catch (LeopardException ex) { }
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console, `${MODEL_FILE}` with the default or custom trained model from [console](https://console.picovoice.ai/), and `${AUDIO_FILE_PATH}` with the path to the audio file.

### Node.js

Install the Node.js SDK:

```console
yarn add @picovoice/leopard-node
```

Create instances of the Leopard class:

```javascript
const Leopard = require("@picovoice/leopard-node");
const accessKey = "${ACCESS_KEY}" // Obtained from the Picovoice Console (https://console.picovoice.ai/)
let handle = new Leopard(accessKey);
console.log(handle.processFile('${AUDIO_PATH}'))
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console]((https://console.picovoice.ai/)) and
`${AUDIO_PATH}` to path an audio file.

When done, be sure to release resources using `release()`:

```javascript
handle.release();
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

const accessKey = "{ACCESS_KEY}"  // AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)

try {
    Leopard _leopard = await Leopard.create(accessKey, '{LEOPARD_MODEL_PATH}');
    String transcript = = await _leopard.processFile("${AUDIO_FILE_PATH}");
} on LeopardException catch (err) { }
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console, `${MODEL_FILE}` with the default or custom trained model from [console](https://console.picovoice.ai/), and `${AUDIO_FILE_PATH}` with the path to the audio file.

### Go

Install the Go binding:

```console
go get github.com/Picovoice/leopard/binding/go
```

Create an instance of the engine and transcribe an audio file:

```go
import . "github.com/Picovoice/leopard/binding/go"

leopard = Leopard{AccessKey: "${ACCESS_KEY}"}
err := leopard.Init()
if err != nil {
    // handle err init
}
defer leopard.Delete()

transcription, err := leopard.ProcessFile("${AUDIO_PATH}")
if err != nil {
    // handle process error
}

log.Println(transcription)
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console]((https://console.picovoice.ai/)) and
`${AUDIO_PATH}` to path an audio file. Finally, when done be sure to explicitly release the resources using
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
  const leopard = await Leopard.create("${ACCESS_KEY}", "${MODEL_FILE}")
  const transcript = await leopard.processFile("${AUDIO_FILE_PATH}")
  console.log(transcript)
} catch (err: any) {
  if (err instanceof LeopardErrors) {
    // handle error
  }
}
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console, `${MODEL_FILE}` with the default or custom trained model from [console](https://console.picovoice.ai/) and `${AUDIO_FILE_PATH}` with the absolute path of the audio file. When done be sure to explicitly release the resources using `leopard.delete()`.

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
    String transcript = leopard.processFile("${AUDIO_PATH}");
    leopard.delete();
} catch (LeopardException ex) { }

System.out.println(transcript);
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console]((https://console.picovoice.ai/)) and `${AUDIO_PATH}` to the path an audio file. Finally, when done be sure to explicitly release the resources using `leopard.delete()`.

### .NET

Install the .NET SDK using NuGet or the dotnet CLI:

```console
dotnet add package Leopard
```

Create an instance of the engine and transcribe an audio file:

```csharp
using Pv;

const string accessKey = "${ACCESS_KEY}";
const string audioPath = "/absolute/path/to/audio_file";

Leopard handle = Leopard.Create(accessKey);

Console.Write(handle.ProcessFile(audioPath));
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console]((https://console.picovoice.ai/)). Finally, when done release the resources using `handle.Dispose()`.

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

let access_key = "${ACCESS_KEY}"; // AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)
let leopard: Leopard = LeopardBuilder::new(access_key).init().expect("Unable to create Leopard");

if let Ok(transcript) = leopard.process_file("/absolute/path/to/audio_file") {
    println!("{}", transcript);
}
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console]((https://console.picovoice.ai/)).

## Releases

### V1.0.0 — January 10th, 2022

* Initial release.
