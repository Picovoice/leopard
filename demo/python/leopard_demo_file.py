#
#    Copyright 2018-2023 Picovoice Inc.
#
#    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
#    file accompanying this source.
#
#    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
#    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
#    specific language governing permissions and limitations under the License.
#

import argparse

from pvleopard import create, LeopardActivationLimitError
from tabulate import tabulate


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--access_key',
        help='AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)',
        required=True)
    parser.add_argument(
        '--library_path',
        help='Absolute path to dynamic library. Default: using the library provided by `pvleopard`')
    parser.add_argument(
        '--model_path',
        help='Absolute path to Leopard model. Default: using the model provided by `pvleopard`')
    parser.add_argument(
        '--disable_automatic_punctuation',
        action='store_true',
        help='Disable insertion of automatic punctuation')
    parser.add_argument(
        '--disable_speaker_diarization',
        action='store_true',
        help='Disable identification of unique speakers')
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Print verbose output of the transcription')
    parser.add_argument(
        '--wav_paths',
        nargs='+',
        required=True,
        metavar='PATH',
        help='Absolute paths to `.wav` files to be transcribed')
    args = parser.parse_args()

    o = create(
        access_key=args.access_key,
        model_path=args.model_path,
        library_path=args.library_path,
        enable_automatic_punctuation=not args.disable_automatic_punctuation,
        enable_diarization=not args.disable_speaker_diarization)

    try:
        for wav_path in args.wav_paths:
            transcript, words = o.process_file(wav_path)
            print(transcript)
            if args.verbose:
                print(tabulate(
                    words,
                    headers=['word', 'start_sec', 'end_sec', 'confidence', 'speaker_tag'],
                    floatfmt='.2f'))
    except LeopardActivationLimitError:
        print('AccessKey has reached its processing limit.')


if __name__ == '__main__':
    main()
