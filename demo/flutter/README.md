# Leopard Flutter Demo

To run the Leopard demo on Android or iOS with Flutter, you must have the [Flutter SDK](https://flutter.dev/docs/get-started/install) installed on your system. Once installed, you can run `flutter doctor` to determine any other missing requirements for your relevant platform. Once your environment has been set up, launch a simulator or connect an Android/iOS device.

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Usage

Run the `prepare_demo` script from [demo/flutter](.) with a language code to set up the demo in the language of your choice (e.g. `de` -> German, `ko` -> Korean). To see a list of available languages, run `prepare_demo` without a language code.

```console
dart scripts/prepare_demo.dart ${LANGUAGE}
```

Replace your `AccessKey` in [lib/main.dart](lib/main.dart) file:

```dart
final String accessKey = "{YOUR_ACCESS_KEY_HERE}"; // AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)
```

Run the following command from [demo/flutter](./) to build and deploy the demo to your device:
```console
flutter run
```

Once the app is loaded:

1. Press the record button.
2. Start talking. Record some phrases or whatever audio you would like to transcribe.
3. Press stop. Wait for the info box to display "Transcribed...". This may take a few seconds.
4. The transcription will appear in the textbox above.
