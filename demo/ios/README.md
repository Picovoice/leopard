# Leopard iOS Demo

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Running the Demo

To run the application demo:

1) From the (demo)[./LeopardDemo] directory run:

```console
pod install
```

2) Open `LeopardDemo/LeopardDemo.xcworkspace` in XCode.

3) Replace `let accessKey = "${YOUR_ACCESS_KEY_HERE}"` in the file [ViewModel.swift](./LeopardDemo/ViewModel.swift) with your `AccessKey`.

4) Go to `Product > Scheme` and select the scheme for the language you would like to demo (e.g. `esScheme` -> Spanish Demo, `deScheme` -> German Demo)

5) Run the demo with a simulator or connected iOS device.
