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
                    sys.stdout.write('\r%s\r' % " " * (len(self._prefix) + 1 + len(frame)))
                    self._stop = False
                    return
                sys.stdout.write('\r%s %s' % (self._prefix, frame))
                time.sleep(self._step_sec)

    def stop(self) -> None:
        self._stop = True
        while self._stop:
            pass


def main():
    parser = ArgumentParser()
    parser.add_argument('--access-key', required=True)
    parser.add_argument('--url', required=True)
    parser.add_argument('--transcript-path', required=True)
    parser.add_argument('--model-path', default=None)
    parser.add_argument('--work-folder', default=os.path.expanduser('~/'))
    parser.add_argument('--retain-webm', action='store_true')
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

    webm_path = os.path.join(work_folder, '%s.webm' % url.split("watch?v=")[1])
    anime = ProgressAnimation('Downloading `%s`' % url)
    anime.start()
    youtube = YouTube(url)
    audio_stream = youtube.streams.filter(only_audio=True, audio_codec='opus').order_by('bitrate').last()
    audio_stream.download(output_path=work_folder, filename=os.path.basename(webm_path), skip_existing=True)
    anime.stop()

    try:
        anime = ProgressAnimation('Transcribing `%s`' % url)
        anime.start()
        start_sec = time.time()
        transcript = leopard.process_file(webm_path)
        proc_sec = time.time() - start_sec
        anime.stop()
        print("Transcribed `%d` seconds in `%.2f` seconds" % (youtube.length, proc_sec))

        if os.path.exists(transcript_path):
            os.remove(transcript_path)
        with open(transcript_path, 'w') as f:
            f.write(transcript)
            f.write('\n')
        print('Saved transcription into `%s`' % transcript_path)
    finally:
        if not retain_webm:
            os.remove(webm_path)


if __name__ == '__main__':
    main()
