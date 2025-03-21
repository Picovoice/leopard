# Leopard Demo

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Setup

Replace `"${YOUR_ACCESS_KEY_HERE}"` inside [MainActivity.java](leopard-demo-app/src/main/java/ai/picovoice/leoparddemo/MainActivity.java)
with your AccessKey obtained from [Picovoice Console](https://console.picovoice.ai/).

1. Open the project in Android Studio
2. Go to `Build > Select Build Variant...` and select the language you would like to run the demo in (e.g. enDebug -> English, itRelease -> Italian)
3. Build and run on an installed simulator or a connected Android device

## Usage

1. Press the record button.
2. Start talking. Record some phrases or whatever audio you would like to transcribe.
3. Press stop. Wait for the info box to display "Transcribed...". This may take a few seconds.
4. The transcription will appear in the textbox above.

## Running the Instrumented Unit Tests

Ensure you have an Android device connected or simulator running. Then run the following from the terminal:

```console
cd demo/android/LeopardDemo
./gradlew connectedAndroidTest -PpvTestingAccessKey="YOUR_ACCESS_KEY_HERE"
```

The test results are stored in `leopard-demo-app/build/reports`.
