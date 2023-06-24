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
from typing import *

import pvleopard
from yt_dlp import YoutubeDL


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


def download_ytdlp(url: str, output_dir: str, options: Optional[Dict[str, Any]] = None) -> List[str]:
    ydl_opts = {
        'outtmpl': "%(id)s.%(ext)s",
        'format': 'bestaudio',
        'paths': {
            'home': output_dir
        },
        'geo_bypass': True,
    }
    if options is not None:
        ydl_opts.update(**options)
    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.sanitize_info(ydl.extract_info(url, download=False))
        ydl.download([url])
        return os.path.join(output_dir, f"{info['id']}.webm"), info['duration']


def main():
    parser = ArgumentParser()
    parser.add_argument('--access_key', required=True)
    parser.add_argument('--url', required=True)
    parser.add_argument('--transcript_path', required=True)
    parser.add_argument('--model_path', default=None)
    parser.add_argument('--work_folder', default=os.path.expanduser('~/'))
    parser.add_argument('--retain_webm', action='store_true')
    args = parser.parse_args()
    access_key = args.access_key
    url = args.url
    transcript_path = args.transcript_path
    model_path = args.model_path
    work_folder = args.work_folder
    retain_webm = args.retain_webm

    anime = ProgressAnimation('Initializing Leopard with AccessKey `%s`' % access_key)
    anime.start()
    leopard = pvleopard.create(access_key=access_key, model_path=model_path)
    anime.stop()

    anime = ProgressAnimation('Downloading `%s`' % url)
    anime.start()
    audio_path, duration = download_ytdlp(url, work_folder)
    anime.stop()

    try:
        anime = ProgressAnimation('Transcribing `%s`' % url)
        anime.start()
        start_sec = time.time()
        transcript, words = leopard.process_file(audio_path)
        proc_sec = time.time() - start_sec
        anime.stop()
        print("Transcribed `%d` seconds in `%.2f` seconds" % (duration, proc_sec))

        if os.path.exists(transcript_path):
            os.remove(transcript_path)
        with open(transcript_path, 'w') as f:
            f.write(transcript)
            f.write('\n')
        print('Saved transcription into `%s`' % transcript_path)
    finally:
        if not retain_webm:
            os.remove(audio_path)


if __name__ == '__main__':
    main()
