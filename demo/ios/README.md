# Leopard iOS Demo

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Running the Demo

To run the application demo:

1. Open [`LeopardDemo/LeopardDemo.xcodeproj`](LeopardDemo/LeopardDemo.xcodeproj/) in XCode.

2. Replace `${YOUR_ACCESS_KEY_HERE}` in the file [ViewModel.swift](./LeopardDemo/LeopardDemo/ViewModel.swift) with your `AccessKey`.

3. Go to `Product > Scheme` and select the scheme for the language you would like to demo (e.g. `esScheme` -> Spanish Demo, `deScheme` -> German Demo)

4. Run the demo with a simulator or connected iOS device.
