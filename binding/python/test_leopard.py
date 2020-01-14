import os
import unittest

import soundfile

from leopard import Leopard


class LeopardTestCase(unittest.TestCase):
    def test_process(self):
        def _abs_path(rel_path):
            return os.path.join(os.path.dirname(__file__), rel_path)

        leopard = Leopard(
            library_path=_abs_path('../../lib/linux/x86_64/libpv_leopard.so'),
            acoustic_model_path=_abs_path('../../lib/common/acoustic_model.pv'),
            language_model_path=_abs_path('../../lib/common/language_model.pv'),
            license_path=_abs_path('../../resources/license/leopard_eval_linux.lic'))

        audio, sample_rate = soundfile.read(_abs_path('../../resources/audio_samples/test.wav'), dtype='int16')
        assert sample_rate == leopard.sample_rate

        transcript = leopard.process(audio)
        self.assertEqual(
            transcript,
            "MISTER QUILTER IS THE APOSTLE OF THE MIDDLE CLASSES AND WE ARE GLAD TO WELCOME HIS GOSPEL")


if __name__ == '__main__':
    unittest.main()
