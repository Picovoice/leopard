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

import os
from ctypes import *
from ctypes.util import find_library
from enum import Enum


class Leopard(object):
    """Python binding for Picovoice's Speech-to-Text engine."""

    class PicovoiceStatuses(Enum):
        """Status codes corresponding to 'pv_status_t' defined in 'include/picovoice.h'"""

        SUCCESS = 0
        OUT_OF_MEMORY = 1
        IO_ERROR = 2
        INVALID_ARGUMENT = 3
        STOP_ITERATION = 4
        KEY_ERROR = 5
        INVALID_STATE = 6

    _PICOVOICE_STATUS_TO_EXCEPTION = {
        PicovoiceStatuses.OUT_OF_MEMORY: MemoryError,
        PicovoiceStatuses.IO_ERROR: IOError,
        PicovoiceStatuses.INVALID_ARGUMENT: ValueError,
        PicovoiceStatuses.STOP_ITERATION: StopIteration,
        PicovoiceStatuses.KEY_ERROR: KeyError,
        PicovoiceStatuses.INVALID_STATE: RuntimeError,
    }

    class CLeopard(Structure):
        pass

    def __init__(self, library_path, acoustic_model_path, language_model_path, license_path):
        """
        Constructor.

        :param library_path: Absolute path to dynamic library.
        :param acoustic_model_path: Absolute path to file containing acoustic model parameters.
        :param language_model_path: Absolute path to file containing language model parameters.
        :param license_path : Absolute path to a valid license file.
        """

        self._libc = CDLL(find_library('c'))

        if not os.path.exists(library_path):
            raise IOError("Could not find Leopard's dynamic library at '%s'" % library_path)

        library = cdll.LoadLibrary(library_path)

        if not os.path.exists(acoustic_model_path):
            raise IOError("Could not find acoustic model file at '%s'" % acoustic_model_path)

        if not os.path.exists(language_model_path):
            raise IOError("Could not find language model file at '%s'" % language_model_path)

        if not os.path.exists(license_path):
            raise IOError("Could not find license file at '%s'" % license_path)

        init_func = library.pv_leopard_init
        init_func.argtypes = [c_char_p, c_char_p, c_char_p, POINTER(POINTER(self.CLeopard))]
        init_func.restype = self.PicovoiceStatuses

        self._handle = POINTER(self.CLeopard)()

        status = init_func(
            acoustic_model_path.encode(),
            language_model_path.encode(),
            license_path.encode(),
            byref(self._handle))
        if status is not self.PicovoiceStatuses.SUCCESS:
            raise self._PICOVOICE_STATUS_TO_EXCEPTION[status]('Initialization failed')

        self._delete_func = library.pv_leopard_delete
        self._delete_func.argtypes = [POINTER(self.CLeopard)]
        self._delete_func.restype = None

        self._process_func = library.pv_leopard_process
        self._process_func.argtypes = [POINTER(self.CLeopard), POINTER(c_short), c_int32, POINTER(c_char_p)]
        self._process_func.restype = self.PicovoiceStatuses

        self._version = library.pv_leopard_version()

        self._sample_rate = library.pv_sample_rate()

    def process(self, pcm):
        """
        Processes a given audio data and returns its transcription.

        :param pcm: The audio needs to have a sample rate equal to 'pv_sample_rate()' and be 16-bit linearly-encoded.
        Leopard operates on single-channel audio.
        :return: Transcription.
        """

        assert pcm.ndim == 1

        c_transcript = c_char_p()
        status = self._process_func(self._handle, (c_short * pcm.size)(*pcm), pcm.size, byref(c_transcript))
        if status is not self.PicovoiceStatuses.SUCCESS:
            raise self._PICOVOICE_STATUS_TO_EXCEPTION[status]('Processing failed')

        transcript = c_transcript.value.decode('utf-8')
        self._libc.free(c_transcript)

        return transcript

    def delete(self):
        """Destructor."""

        self._delete_func(self._handle)

    @property
    def version(self):
        """Getter for version string."""

        return self._version

    @property
    def sample_rate(self):
        """Audio sample rate accepted by Leopard engine."""

        return self._sample_rate
