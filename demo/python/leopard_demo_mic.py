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

import signal
import sys
import time
from argparse import ArgumentParser
from threading import Thread

from pvleopard import *
from pvrecorder import PvRecorder
from tabulate import tabulate


class Recorder(Thread):
    def __init__(self):
        super().__init__()
        self._pcm = list()
        self._is_recording = False
        self._stop = False

    def is_recording(self):
        return self._is_recording

    def run(self):
        self._is_recording = True

        recorder = PvRecorder(device_index=-1, frame_length=160)
        recorder.start()

        while not self._stop:
            self._pcm.extend(recorder.read())
        recorder.stop()

        self._is_recording = False

    def stop(self):
        self._stop = True
        while self._is_recording:
            pass

        return self._pcm


def main():
    parser = ArgumentParser()
    parser.add_argument('--access_key', required=True)
    parser.add_argument('--model_path', default=None)
    parser.add_argument('--library_path', default=None)
    parser.add_argument('--disable_automatic_punctuation', action='store_true')
    parser.add_argument('--verbose', action='store_true')
    args = parser.parse_args()

    o = create(
        access_key=args.access_key,
        model_path=args.model_path,
        library_path=args.library_path,
        enable_automatic_punctuation=not args.disable_automatic_punctuation)

    recorder = None

    def on_exit(_, __):
        o.delete()

        if recorder is not None:
            recorder.stop()

        print()
        sys.exit(0)

    signal.signal(signal.SIGINT, on_exit)

    print('>>> Press `CTRL+C` to exit: ')

    while True:
        if recorder is not None:
            input('>>> Recording ... Press `ENTER` to stop: ')
            try:
                transcript, words = o.process(recorder.stop())
                print(transcript)
                if args.verbose:
                    print(tabulate(words, headers=['word', 'start_sec', 'end_sec', 'confidence'], floatfmt='.2f'))
            except LeopardActivationLimitError:
                print("AccessKey '%s' has reached it's processing limit." % args.access_key)
            print()
            recorder = None
        else:
            input('>>> Press `ENTER` to start: ')
            recorder = Recorder()
            recorder.start()
            time.sleep(.25)


if __name__ == '__main__':
    main()
