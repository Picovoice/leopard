# Leopard microservice demo with gRPC

A demo application that demonstrates how to implement a lightweight transcription microservice with gRPC using Picovoice Leopard. In this project, the client sends an audio file to the server via gRPC and gets back the transcript.

## Compatibility

- go 1.16+
- Runs on Linux (x86_64), macOS (x86_64, arm64), Windows (x86_64), Raspberry Pi (3, 4, 5), and NVIDIA Jetson Nano.

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using Leopard SDKs.
You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.
Signup or Login to [Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Usage

### Server

Start the server first by running the following command from the demo folder:
```console
go run server.go \
--access_key "${ACCESS_KEY}"
```

Replace `${ACCESS_KEY}` with yours obtained from Picovoice Console.

### Client

While the server is up, make a transcription request:

```console
go run client.go \
--input_audio "${AUDIO_FILE_PATH}"
``````

Replace `${AUDIO_FILE_PATH}` with a path to an audio file you wish to transcribe.
