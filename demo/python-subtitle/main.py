#
#    Copyright 2022 Picovoice Inc.
#
#    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
#    file accompanying this source.
#
#    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
#    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
#    specific language governing permissions and limitations under the License.
#

import os
import sys
import time
from argparse import ArgumentParser
from threading import Thread

import pvleopard
from pytube import YouTube


class ProgressAnimation(Thread):
    def __init__(self, prefix: str, step_sec: float = 0.19) -> None:
        super().__init__()

        self._prefix = prefix
        self._step_sec = step_sec
        self._frames = (
            ".  ",
            ".. ",
            "...",
            " ..",
            "  .",
            "   "
        )
        self._stop = False

    def run(self) -> None:
        while True:
            for frame in self._frames:
                if self._stop:
                    sys.stdout.write('\r%s\r' % (" " * (len(self._prefix) + 1 + len(frame))))
                    self._stop = False
                    return
                sys.stdout.write('\r%s %s' % (self._prefix, frame))
                time.sleep(self._step_sec)

    def stop(self) -> None:
        self._stop = True
        while self._stop:
            pass


def main() -> None:
    parser = ArgumentParser()
    parser.add_argument('--access-key', required=True)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--youtube-url', default=None)
    group.add_argument('--audio-path', default=None)
    parser.add_argument('--subtitle-path', required=True)
    parser.add_argument('--model-path', default=None)
    args = parser.parse_args()

    access_key = args.access_key
    youtube_url = args.youtube_url
    audio_path = args.audio_path
    subtitle_path = args.subtitle_path
    model_path = args.model_path

    anime = ProgressAnimation('Initializing Leopard with AccessKey `%s`' % access_key)
    anime.start()
    try:
        leopard = pvleopard.create(access_key=access_key, model_path=model_path)
    except pvleopard.LeopardError as e:
        print("Failed to initialize Leopard with `%s`" % e)
        exit(1)
    finally:
        anime.stop()

    if audio_path is not None:
        if not os.path.exists(audio_path):
            print("`%s` does not exist" % audio_path)
            exit(1)
    else:
        audio_path = os.path.join(os.path.dirname(subtitle_path), '%s.webm' % youtube_url.split("watch?v=")[1])

    if youtube_url is not None and not os.path.exists(audio_path):
        anime = ProgressAnimation('Downloading `%s`' % youtube_url)
        anime.start()
        try:
            youtube = YouTube(youtube_url)
            audio_stream = youtube.streams.filter(mime_type='audio/webm').order_by('bitrate').last()
            audio_stream.download(
                output_path=os.path.dirname(audio_path),
                filename=os.path.basename(audio_path),
                skip_existing=True)
        except Exception as e:
            print("Failed to download from YouTube with `%s`" % e)
        finally:
            anime.stop()

    try:
        anime = ProgressAnimation('Transcribing `%s`' % youtube_url)
        anime.start()
        try:
            start_sec = time.time()
            # noinspection PyUnboundLocalVariable
            transcript, words = leopard.process_file(audio_path)
            proc_sec = time.time() - start_sec
        except pvleopard.LeopardError as e:
            anime.stop()
            print("Failed to transcribe audio with `%s`" % e)
            exit(1)
        else:
            anime.stop()
            print("Transcribed `%.2f` seconds" % proc_sec)

        if os.path.exists(subtitle_path):
            os.remove(subtitle_path)
        with open(subtitle_path, 'w') as f:
            # noinspection PyUnboundLocalVariable
            f.write(transcript)
            f.write('\n')
        print('Saved transcription into `%s`' % subtitle_path)
    finally:
        pass


if __name__ == '__main__':
    main()
