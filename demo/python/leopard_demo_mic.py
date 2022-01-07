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

import argparse
import sys
import threading
import time
import pvleopard
from pvrecorder import PvRecorder


class Recorder(threading.Thread):
    def __init__(self):
        super().__init__()
        self._frames = list()
        self._stop = False

    def run(self):
        recorder = PvRecorder(device_index=-1, frame_length=1234)
        recorder.start()

        while not self._stop:
            self._frames.extend(recorder.read())
        recorder.stop()

    def stop(self):
        self._stop = True
        return self._frames


class LoadingAnimation(threading.Thread):
    def __init__(self, sleep_time_sec=0.1):
        self._sleep_time_sec = sleep_time_sec
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
        while not self._done:
            for frame in self._frames:
                if self._done:
                    break
                sys.stdout.write('\r' + frame)
                time.sleep(self._sleep_time_sec)

    def stop(self):
        self._done = True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--access_key', required=True)
    parser.add_argument('--library_path', default=None)
    parser.add_argument('--model_path', default=None)
    args = parser.parse_args()

    leopard = pvleopard.create(
        access_key=args.access_key,
        library_path=args.library_path,
        model_path=args.model_path)

    # indexing_animation = LoadingAnimation()
    # indexing_animation.start()

    recorder = None

    options = {
        "R": "record",
        "S": "stop",
        "Q": "quit"
    }

    def help_from_options(*a):
        return 'or '.join([f'`{x}` for {options[x]}' for x in a])

    help = help_from_options('R', 'Q')
    while True:
        command = input(help)
        if command == "Q":
            break
        elif command == "R":
            recorder = Recorder()
            recorder.start()
            help = help_from_options('S')
        elif command == "S":
            pcm = recorder.stop()
            print(leopard.process(pcm))
            help = help_from_options('R', 'Q')
        else:
            pass


if __name__ == '__main__':
    main()
