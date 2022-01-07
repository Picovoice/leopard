#
#    Copyright 2018-2022 Picovoice Inc.
#
#    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
#    file accompanying this source.
#
#    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
#    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
#    specific language governing permissions and limitations under the License.
#

import argparse
import os

import soundfile
import pvleopard


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--access_key', required=True)
    parser.add_argument('--library_path', default=None)
    parser.add_argument('--model_path', default=None)

    parser.add_argument(
        '--audio_paths',
        nargs='+',
        help='absolute paths to audio files to be transcribed',
        required=True)

    args = parser.parse_args()

    leopard = pvleopard.create(
        access_key=args.access_key,
        library_path=args.library_path,
        model_path=args.model_path)

    for audio_path in args.audio_paths:
        audio_path = os.path.expanduser(audio_path.strip())
        audio, sample_rate = soundfile.read(audio_path, dtype='int16')
        if sample_rate != leopard.sample_rate:
            raise ValueError('Leopard can only process audio data with sample rate of %d' % leopard.sample_rate)

        transcript = leopard.process(audio)

        print(transcript)
