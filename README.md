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
        - [Go](#go-demo)
    - [SDKs](#sdks)
        - [Python](#python)
        - [C](#c)
        - [iOS](#ios)
        - [Android](#android)
        - [Node.js](#nodejs)
        - [Go](#go)
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
leopard_demo_file --access_key ${ACCESS_KEY} --audio_paths ${AUIDO_PATH}
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

With a working microphone connected to your device, run the following in the terminal:

```console
leopard-mic-demo --access_key ${ACCESS_KEY}
```

For more information about Node.js demos go to [demo/nodejs](/demo/nodejs).
### Go Demo

The demo requires `cgo`, which on Windows may mean that you need to install a gcc compiler like [Mingw](http://mingw-w64.org/doku.php) to build it properly. 

From [demo/go](/demo/go) run the following command from the terminal to build and run the file demo:

```console
go run filedemo/leopard_file_demo.go -access_key "${ACCESS_KEY}"  -input_audio_path "${AUDIO_PATH}"
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console and `${AUDIO_PATH}` with a path to an audio file you wish to transcribe.

For more information about Go demos go to [demo/go](/demo/go).

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

Create an instance of the engine and transcribe an audio_file:

```java
import ai.picovoice.leopard.*;

final String accessKey = "${ACCESS_KEY}"; // AccessKey obtained from Picovoice Console (https://picovoice.ai/console/)
final String modelPath = "${MODEL_FILE}";
try {
    Leopard handle = new Leopard.Builder(accessKey).setModelPath(modelPath).build(appContext);

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

transcription, err := leopard.ProcessFile("${AUDIO_PATH}")
if err != nil {
    // handle process error
}

log.Println(transcription)
```

Replace `${ACCESS_KEY}` with yours obtained from [Picovoice Console]((https://console.picovoice.ai/)) and
`${AUDIO_PATH}` to path an audio file. Finally, when done be sure to explicitly release the resources using
`handle.delete()`.

## Releases

### V1.0.0 — January 10th, 2022

* Initial release.
