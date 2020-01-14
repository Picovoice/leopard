import argparse
import os
import sys

import soundfile

sys.path.append(os.path.join(os.path.dirname(__file__), '../../binding/python'))

from leopard import Leopard


if __name__ == '__main__':
    def _abs_path(rel_path):
        return os.path.join(os.path.dirname(__file__), '../..', rel_path)

    parser = argparse.ArgumentParser()

    parser.add_argument(
        '--library_path',
        help="absolute path to Cheetah's dynamic library",
        type=str,
        default=_abs_path('lib/linux/x86_64/libpv_leopard.so'))

    parser.add_argument(
        '--acoustic_model_path',
        help='absolute path to acoustic model parameter file',
        type=str,
        default=_abs_path('lib/common/acoustic_model.pv'))

    parser.add_argument(
        '--language_model_path',
        help='absolute path to language model parameter file',
        type=str,
        default=_abs_path('lib/common/language_model.pv'))

    parser.add_argument(
        '--license_path',
        help='absolute path to license file',
        type=str,
        default=_abs_path('resources/license/leopard_eval_linux.lic'))

    parser.add_argument(
        '--audio_paths',
        help='comma-separated absolute paths to audio files to be transcribed',
        type=str,
        required=True)

    args = parser.parse_args()

    leopard = Leopard(
        library_path=args.library_path,
        acoustic_model_path=args.acoustic_model_path,
        language_model_path=args.language_model_path,
        license_path=args.license_path)

    for audio_path in [os.path.expanduser(x.strip()) for x in args.audio_paths.split(',')]:
        audio, sample_rate = soundfile.read(audio_path, dtype='int16')
        if sample_rate != leopard.sample_rate:
            raise ValueError('Cheetah can only process audio data with sample rate of %d' % leopard.sample_rate)

        transcript = leopard.process(audio)

        print(transcript)
