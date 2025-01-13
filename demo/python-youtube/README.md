# Leopard YouTube Demo

## Compatibility
- Python 3.8+
- Runs on Linux (x86_64), macOS (x86_64, arm64), Windows (x86_64, arm64), and Raspberry Pi (3, 4, 5).

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using
Leopard SDKs. You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.  Signup or Login to
[Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Usage

From the root of the repository, install Python dependencies:

```console
pip3 install -r demo/python-youtube/requirements.txt
```

Transcribe a YouTube video:

```console
python3 demo/python-youtube/main.py \
--access-key ${ACCESS_KEY} \
--url ${URL} \
--transcript-path ${TRANSCRIPT_PATH}
```

Replace `${ACCESS_KEY}` with your own obtained from [Picovoice Console](https://console.picovoice.ai/). Replace
`${URL}` with the URL to a video (not a playlist or channel). A video URL on YouTube should look like this:
`https://www.youtube.com/watch?v=${VIDEO_UUID}`. `${TRANSCRIPT_PATH}` is the path to the file where transcription
is saved to.
