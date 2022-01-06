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
from enum import Enum
from typing import *


class LeopardError(Exception):
    pass


class LeopardMemoryError(LeopardError):
    pass


class LeopardIOError(LeopardError):
    pass


class LeopardInvalidArgumentError(LeopardError):
    pass


class LeopardStopIterationError(LeopardError):
    pass


class LeopardKeyError(LeopardError):
    pass


class LeopardInvalidStateError(LeopardError):
    pass


class LeopardRuntimeError(LeopardError):
    pass


class LeopardActivationError(LeopardError):
    pass


class LeopardActivationLimitError(LeopardError):
    pass


class LeopardActivationThrottledError(LeopardError):
    pass


class LeopardActivationRefusedError(LeopardError):
    pass


class Leopard(object):
    class PicovoiceStatuses(Enum):
        SUCCESS = 0
        OUT_OF_MEMORY = 1
        IO_ERROR = 2
        INVALID_ARGUMENT = 3
        STOP_ITERATION = 4
        KEY_ERROR = 5
        INVALID_STATE = 6
        RUNTIME_ERROR = 7
        ACTIVATION_ERROR = 8
        ACTIVATION_LIMIT_REACHED = 9
        ACTIVATION_THROTTLED = 10
        ACTIVATION_REFUSED = 11

    _PICOVOICE_STATUS_TO_EXCEPTION = {
        PicovoiceStatuses.OUT_OF_MEMORY: LeopardMemoryError,
        PicovoiceStatuses.IO_ERROR: LeopardIOError,
        PicovoiceStatuses.INVALID_ARGUMENT: LeopardInvalidArgumentError,
        PicovoiceStatuses.STOP_ITERATION: LeopardStopIterationError,
        PicovoiceStatuses.KEY_ERROR: LeopardKeyError,
        PicovoiceStatuses.INVALID_STATE: LeopardInvalidStateError,
        PicovoiceStatuses.RUNTIME_ERROR: LeopardRuntimeError,
        PicovoiceStatuses.ACTIVATION_ERROR: LeopardActivationError,
        PicovoiceStatuses.ACTIVATION_LIMIT_REACHED: LeopardActivationLimitError,
        PicovoiceStatuses.ACTIVATION_THROTTLED: LeopardActivationThrottledError,
        PicovoiceStatuses.ACTIVATION_REFUSED: LeopardActivationRefusedError
    }

    class CLeopard(Structure):
        pass

    def __init__(self, access_key: str, library_path: str, model_path: str) -> None:
        if not os.path.exists(library_path):
            raise LeopardIOError("Could not find Leopard's dynamic library at '%s'" % library_path)

        library = cdll.LoadLibrary(library_path)

        if not os.path.exists(model_path):
            raise LeopardIOError("Could not find model file at '%s'" % model_path)

        init_func = library.pv_leopard_init
        init_func.argtypes = [c_char_p, c_char_p, POINTER(POINTER(self.CLeopard))]
        init_func.restype = self.PicovoiceStatuses

        self._handle = POINTER(self.CLeopard)()

        status = init_func(access_key.encode(), model_path.encode(), byref(self._handle))
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

    def process(self, pcm: Sequence[int]) -> str:
        c_transcript = c_char_p()
        status = self._process_func(self._handle, (c_short * len(pcm))(*pcm), len(pcm), byref(c_transcript))
        if status is not self.PicovoiceStatuses.SUCCESS:
            raise self._PICOVOICE_STATUS_TO_EXCEPTION[status]('Processing failed')

        return c_transcript.value.decode('utf-8')

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
