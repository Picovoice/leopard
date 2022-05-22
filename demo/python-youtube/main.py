import os
import sys
import time
from argparse import ArgumentParser
from threading import Thread

import pvleopard
from pytube import YouTube


class ProgressAnimation(Thread):
    def __init__(self, prefix, step_sec=0.1):
        self._prefix = prefix
        self._step_sec = step_sec
        self._frames = [
            ".  ",
            ".. ",
            "...",
            " ..",
            "  .",
            "   "
        ]
        self._done = False
        super().__init__()

    def run(self):
        self._done = False
        while True:
            for frame in self._frames:
                if self._done:
                    sys.stdout.write(f'\r{" " * (len(self._prefix) + 1 + len(frame))}\r')
                    return
                sys.stdout.write(f'\r{self._prefix} {frame}')
                time.sleep(self._step_sec)

    def stop(self):
        self._done = True


def download(url, folder):
    webm_path = os.path.join(folder, f'{url.split("watch?v=")[1]}.webm')
    if not os.path.exists(webm_path):
        anime = ProgressAnimation(f'Downloading {url}')
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
    args = parser.parse_args()

    print(f'Initializing Leopard with AccessKey {args.access_key}')
    leopard = pvleopard.create(access_key=args.access_key)

    webm_path = download(url=args.url, folder=args.work_folder)

    anime = ProgressAnimation(f'Transcribing {args.url}')
    anime.start()
    transcript = leopard.process_file(webm_path)
    anime.stop()

    if os.path.exists(args.transcript_path):
        os.remove(args.transcript_path)

    print(f'Saving transcription into {args.transcript_path}')
    with open(args.transcript_path, 'w') as f:
        f.write(transcript)
        f.write('\n')


if __name__ == '__main__':
    main()
