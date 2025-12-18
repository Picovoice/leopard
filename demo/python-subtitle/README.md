# Leopard Subtitle Demo

## Compatibility
- Python 3.9+
- Runs on Linux (x86_64), macOS (x86_64, arm64), Windows (x86_64, arm64), and Raspberry Pi (3, 4, 5).

## AccessKey

Leopard requires a valid Picovoice `AccessKey` at initialization. `AccessKey` acts as your credentials when using
Leopard SDKs. You can get your `AccessKey` for free. Make sure to keep your `AccessKey` secret.  Signup or Login to
[Picovoice Console](https://console.picovoice.ai/) to get your `AccessKey`.

## Usage

From the root of the repository, install Python dependencies:

```console
pip3 install -r demo/python-subtitle/requirements.txt
```

Generate subtitles for a YouTube video:

```console
python3 demo/python-subtitle/main.py \
--access-key ${ACCESS_KEY} \
--youtube-url ${YOUTUBE_URL} \
--subtitle-path ${SUBTITLE_PATH}
```

or any audio file:

```console
python3 demo/python-subtitle/main.py \
--access-key ${ACCESS_KEY} \
--audio-path ${AUDIO_FILE_PATH} \
--subtitle-path ${SUBTITLE_PATH}
```

Replace `${ACCESS_KEY}` with your own obtained from [Picovoice Console](https://console.picovoice.ai/). Replace
`${YOUTUBE_URL}` with the URL to a video (not a playlist or channel). A video URL on YouTube should look like this:
`https://www.youtube.com/watch?v=${VIDEO_UUID}`. Replace `AUDIO_PATH` with the path to an audio file. ${SUBTITLE_PATH}`
is the path to the [SRT](https://en.wikipedia.org/wiki/SubRip) subtitle file.
