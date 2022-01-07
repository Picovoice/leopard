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

from argparse import ArgumentParser
from threading import Thread
import time
import pvleopard
from pvrecorder import PvRecorder


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

        recorder = PvRecorder(device_index=-1, frame_length=1234)
        recorder.start()

        while not self._stop:
            self._pcm.extend(recorder.read())
        recorder.stop()

        self._is_recording = False

    def stop(self):
        self._stop = True
        while self._is_recording:
            pass

        pcm = self._pcm
        self._pcm = list()

        return pcm


def main():
    parser = ArgumentParser()
    parser.add_argument('--access_key', required=True)
    parser.add_argument('--library_path', default=None)
    parser.add_argument('--model_path', default=None)
    args = parser.parse_args()

    leopard = pvleopard.create(access_key=args.access_key, library_path=args.library_path, model_path=args.model_path)

    recorder = None

    while True:
        if recorder is not None:
            input('>>> Recording ... Press `ENTER` to stop: ')
            print(leopard.process(recorder.stop()))
            print()
            recorder = None
        else:
            input('>>> Press `ENTER` to start: ')
            recorder = Recorder()
            recorder.start()
            time.sleep(1.)


if __name__ == '__main__':
    main()
