#
#    Copyright 2018-2025 Picovoice Inc.
#
#    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
#    file accompanying this source.
#
#    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
#    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
#    specific language governing permissions and limitations under the License.
#

import argparse

from pvleopard import available_devices, create, LeopardActivationLimitError
from tabulate import tabulate


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--access_key',
        help='AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)')
    parser.add_argument(
        '--library_path',
        help='Absolute path to dynamic library. Default: using the library provided by `pvleopard`')
    parser.add_argument(
        '--model_path',
        help='Absolute path to Leopard model. Default: using the model provided by `pvleopard`')
    parser.add_argument(
        '--device',
        help='Device to run inference on (`best`, `cpu:{num_threads}` or `gpu:{gpu_index}`).'
             'Default: automatically selects best device for `pvleopard`')
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
        metavar='PATH',
        help='Absolute paths to `.wav` files to be transcribed')
    parser.add_argument(
        '--show_inference_devices',
        action='store_true',
        help='Show the list of available devices for Leopard inference and exit')
    args = parser.parse_args()

    if args.show_inference_devices:
        print('\n'.join(available_devices(library_path=args.library_path)))
        return

    if args.access_key is None:
        raise ValueError('Missing required argument --access_key')

    if args.wav_paths is None:
        raise ValueError('Missing required argument --wav_paths')

    o = create(
        access_key=args.access_key,
        model_path=args.model_path,
        device=args.device,
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
