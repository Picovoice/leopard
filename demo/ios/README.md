# Leopard iOS Demo

## AccessKey

Leopard requires a valid `AccessKey` at initialization. `AccessKey`s act as your credentials when using Leopard SDKs.
You can create your `AccessKey` for free. Make sure to keep your `AccessKey` secret.

To obtain your `AccessKey`:
1. Login or Signup for a free account on the [Picovoice Console](https://picovoice.ai/console/).
2. Once logged in, go to the [`AccessKey` tab](https://console.picovoice.ai/access_key) to create one or use an existing `AccessKey`.

Copy your `AccessKey` into the `ACCESS_KEY` variable inside [`ViewModel.swift`](/demo/ios/LeopardDemo/LeopardDemo/ViewModel.swift#L24) before building the demo.

## Running the Demo

Before building the demo app, run the following from [LeopardDemo](/demo/ios/LeopardDemo) directory to install the Leopard Cocoapod:

```console
pod install
```
Open [LeopardDemo.xcworkspace](/demo/ios/LeopardDemo/LeopardDemo.xcworkspace`) and run the demo.
