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

from pvleopard import *
from tabulate import tabulate


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--access_key', required=True)
    parser.add_argument('--model_path', default=None)
    parser.add_argument('--library_path', default=None)
    parser.add_argument('--disable_automatic_punctuation', action='store_true')
    parser.add_argument('--verbose', action='store_true')
    parser.add_argument('--audio_paths', nargs='+', required=True)
    args = parser.parse_args()

    o = create(
        access_key=args.access_key,
        model_path=args.model_path,
        library_path=args.library_path,
        enable_automatic_punctuation=not args.disable_automatic_punctuation)

    try:
        for audio_path in args.audio_paths:
            transcript, words = o.process_file(audio_path)
            print(transcript)
            if args.verbose:
                print(tabulate(words, headers=['word', 'start_sec', 'end_sec', 'confidence'], floatfmt='.2f'))
    except LeopardActivationLimitError:
        print("AccessKey '%s' has reached it's processing limit." % args.access_key)


if __name__ == '__main__':
    main()
