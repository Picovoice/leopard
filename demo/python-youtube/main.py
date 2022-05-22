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
                    sys.stdout.write(f'\r{" " * (len(self._prefix) + 1 + len(frame))}\r')
                    self._stop = False
                    return
                sys.stdout.write(f'\r{self._prefix} {frame}')
                time.sleep(self._step_sec)

    def stop(self) -> None:
        self._stop = True
        while self._stop:
            pass


def download(url: str, folder: str) -> str:
    webm_path = os.path.join(folder, f'{url.split("watch?v=")[1]}.webm')
    if not os.path.exists(webm_path):
        anime = ProgressAnimation(f'Downloading `{url}`')
        anime.start()
        youtube = YouTube(url)
        audio_stream = youtube.streams.filter(only_audio=True, audio_codec='opus').order_by('bitrate').last()
        audio_stream.download(output_path=folder, filename=os.path.basename(webm_path), skip_existing=True)
        anime.stop()

    return webm_path


def main():
    parser = ArgumentParser()
    parser.add_argument('--access-key', required=True)
    parser.add_argument('--url', required=True)
    parser.add_argument('--transcript-path', required=True)
    parser.add_argument('--work-folder', default=os.path.expanduser('~/'))
    parser.add_argument('--retain-webm', action='store_true')
    args = parser.parse_args()

    access_key = args.access_key
    url = args.url
    transcript_path = args.transcript_path
    work_folder = args.work_folder

    print(f'Initializing Leopard with AccessKey `{access_key}`')
    leopard = pvleopard.create(access_key=access_key)

    webm_path = download(url=url, folder=work_folder)

    anime = ProgressAnimation(f'Transcribing `{url}`')
    anime.start()
    transcript = leopard.process_file(webm_path)
    anime.stop()

    if os.path.exists(transcript_path):
        os.remove(transcript_path)

    print(f'Saving transcription into `{transcript_path}`')
    with open(transcript_path, 'w') as f:
        f.write(transcript)
        f.write('\n')


if __name__ == '__main__':
    main()
