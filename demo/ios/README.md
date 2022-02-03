# Leopard iOS Demo

## AccessKey

Leopard requires a valid `AccessKey` at initialization. `AccessKey`s act as your credentials when using Leopard SDKs.
You can create your `AccessKey` for free. Make sure to keep your `AccessKey` secret.

To obtain your `AccessKey`:
1. Login or Signup for a free account on the [Picovoice Console](https://picovoice.ai/console/).
2. Once logged in, go to the [`AccessKey` tab](https://console.picovoice.ai/access_key) to create one or use an existing `AccessKey`.

Copy your `AccessKey` into the `ACCESS_KEY` variable inside [`ViewModel.swift`](LeopardDemo/LeopardDemo/ViewModel.swift#L24) before building the demo.

## Running the Demo

Before building the demo app, run the following from [LeopardDemo](LeopardDemo) directory to install the Leopard Cocoapod:

```ruby
pod install
```
Open [LeopardDemo.xcworkspace](LeopardDemo/LeopardDemo.xcworkspace`) and run the demo.

## Running the On-Device Unit Tests

Copy your `AccessKey` into the `accessKey` variable in [LeopardDemoUITests.swift](LeopardDemo/LeopardDemoUITests/LeopardDemoUITests.swift). Open [LeopardDemo.xcworkspace](LeopardDemo/LeopardDemo.xcworkspace`)  with XCode and run the tests with `Product > Test`.