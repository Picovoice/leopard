import os
from ctypes import *
from ctypes.util import find_library
from enum import Enum


class Leopard(object):
    class PicovoiceStatuses(Enum):
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
        self._libc = CDLL(find_library('c'))

        if not os.path.exists(library_path):
            raise IOError("Could not find Cheetah's dynamic library at '%s'" % library_path)

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
        self._process_func.argtypes = \
            [POINTER(self.CLeopard), POINTER(c_short), c_int32, POINTER(c_char_p)]
        self._process_func.restype = self.PicovoiceStatuses

        self._version = library.pv_leopard_version()

        self._sample_rate = library.pv_sample_rate()

    def process(self, pcm):
        assert pcm.ndim == 1

        c_transcript = c_char_p()
        status = self._process_func(self._handle, (c_short * pcm.size)(*pcm), pcm.size, byref(c_transcript))
        if status is not self.PicovoiceStatuses.SUCCESS:
            raise self._PICOVOICE_STATUS_TO_EXCEPTION[status]('Processing failed')

        transcript = c_transcript.value.decode('utf-8')
        self._libc.free(c_transcript)

        return transcript

    def delete(self):
        self._delete_func(self._handle)

    @property
    def version(self):
        return self._version

    @property
    def sample_rate(self):
        return self._sample_rate
