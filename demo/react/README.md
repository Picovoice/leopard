# leopard-web-react-demo

This demo application consists of a `Transcriber` component which uses the `useLeopard` react hook to perform speech-to-text. It instantiates a Leopard worker engine and uses it with the [@picovoice/web-voice-processor](https://www.npmjs.com/package/@picovoice/web-voice-processor) to access (and automatically downsample) microphone audio.

If you decline microphone permission in the browser, or another such issue prevents Leopard from starting, the error will be displayed.

The demo also shows the various loading and error states, as well as mounting/unmounting the `Transcriber` with a toggle, demonstrating the complete lifecycle of Leopard within a React app.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Install and Run

Use `yarn` or `npm` to install the dependencies, and the `start` script with a language code
to start a local web server hosting the demo in the language of your choice (e.g. `de` -> German, `ko` -> Korean).
To see a list of available languages, run `start` without a language code.

```console
yarn
yarn start ${LANGUAGE}
```

(or)

```console
npm install
npm run start ${LANGUAGE}
```

Open `http://localhost:3000` to view it in the browser.

The page will reload if you make edits. You will also see any lint errors in the console.

Wait until Leopard has initialized. Choose an audio file or record audio to transcribe.
