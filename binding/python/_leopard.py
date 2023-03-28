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

import os
import pathlib
from collections import namedtuple
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
    """
    Python binding for Leopard speech-to-text engine.
    """

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

    _VALID_EXTENSIONS = (
        "3gp",
        "flac",
        "m4a",
        "mp3",
        "mp4",
        "ogg",
        "opus",
        "vorbis",
        "wav",
        "webm",
    )

    class CLeopard(Structure):
        pass

    class CWord(Structure):
        _fields_ = [
            ("word", c_char_p),
            ("start_sec", c_float),
            ("end_sec", c_float),
            ("confidence", c_float)]

    def __init__(
            self,
            access_key: str,
            model_path: str,
            library_path: str,
            enable_automatic_punctuation: bool = False) -> None:
        """
        Constructor.

        :param access_key: AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)
        :param model_path: Absolute path to the file containing model parameters.
        :param library_path: Absolute path to Leopard's dynamic library.
        :param enable_automatic_punctuation Set to `True` to enable automatic punctuation insertion.
        """

        if not isinstance(access_key, str) or len(access_key) == 0:
            raise LeopardInvalidArgumentError("`access_key` should be a non-empty string.")

        if not os.path.exists(model_path):
            raise LeopardIOError("Could not find model file at `%s`." % model_path)

        if not os.path.exists(library_path):
            raise LeopardIOError("Could not find Leopard's dynamic library at `%s`." % library_path)

        library = cdll.LoadLibrary(library_path)

        init_func = library.pv_leopard_init
        init_func.argtypes = [c_char_p, c_char_p, c_bool, POINTER(POINTER(self.CLeopard))]
        init_func.restype = self.PicovoiceStatuses

        self._handle = POINTER(self.CLeopard)()

        status = init_func(access_key.encode(), model_path.encode(), enable_automatic_punctuation, byref(self._handle))
        if status is not self.PicovoiceStatuses.SUCCESS:
            raise self._PICOVOICE_STATUS_TO_EXCEPTION[status]()

        self._delete_func = library.pv_leopard_delete
        self._delete_func.argtypes = [POINTER(self.CLeopard)]
        self._delete_func.restype = None

        self._process_func = library.pv_leopard_process
        self._process_func.argtypes = [
            POINTER(self.CLeopard),
            POINTER(c_short),
            c_int32,
            POINTER(c_char_p),
            POINTER(c_int32),
            POINTER(POINTER(self.CWord))
        ]
        self._process_func.restype = self.PicovoiceStatuses

        self._process_file_func = library.pv_leopard_process_file
        self._process_file_func.argtypes = [
            POINTER(self.CLeopard),
            c_char_p,
            POINTER(c_char_p),
            POINTER(c_int32),
            POINTER(POINTER(self.CWord))
        ]
        self._process_file_func.restype = self.PicovoiceStatuses

        version_func = library.pv_leopard_version
        version_func.argtypes = []
        version_func.restype = c_char_p
        self._version = version_func().decode('utf-8')

        self._sample_rate = library.pv_sample_rate()

        self._transcript_delete_func = library.pv_leopard_transcript_delete
        self._transcript_delete_func.argtypes = [
            c_char_p
        ]
        self._transcript_delete_func.restype = None

        self._words_delete_func = library.pv_leopard_words_delete
        self._words_delete_func.argtypes = [
            POINTER(self.CWord)
        ]
        self._words_delete_func.restype = None

    Word = namedtuple('Word', ['word', 'start_sec', 'end_sec', 'confidence'])

    def process(self, pcm: Sequence[int]) -> Tuple[str, Sequence[Word]]:
        """
        Processes a given audio data and returns its transcription.

        :param pcm: Audio data. The audio needs to have a sample rate equal to `.sample_rate` and be 16-bit
        linearly-encoded. This function operates on single-channel audio. If you wish to process data in a different
        sample rate or format consider using `.process_file`.
        :return: Inferred transcription and sequence of transcribed words and their associated metadata.
        """

        if len(pcm) == 0:
            raise LeopardInvalidArgumentError()

        c_transcript = c_char_p()
        num_words = c_int32()
        c_words = POINTER(self.CWord)()
        status = self._process_func(
            self._handle,
            (c_short * len(pcm))(*pcm),
            len(pcm),
            byref(c_transcript),
            byref(num_words),
            byref(c_words))
        if status is not self.PicovoiceStatuses.SUCCESS:
            raise self._PICOVOICE_STATUS_TO_EXCEPTION[status]()

        transcript = c_transcript.value.decode('utf-8')
        self._transcript_delete_func(c_transcript)

        words = list()
        for i in range(num_words.value):
            word = self.Word(
                word=c_words[i].word.decode('utf-8'),
                start_sec=c_words[i].start_sec,
                end_sec=c_words[i].end_sec,
                confidence=c_words[i].confidence)
            words.append(word)

        self._words_delete_func(c_words)

        return transcript, words

    def process_file(self, audio_path: str) -> Tuple[str, Sequence[Word]]:
        """
        Processes a given audio file and returns its transcription.

        :param audio_path: Absolute path to the audio file. The file needs to have a sample rate equal to or greater
        than `.sample_rate`. The supported formats are: `FLAC`, `MP3`, `Ogg`, `Opus`, `Vorbis`, `WAV`, and `WebM`.
        :return: Inferred transcription and sequence of transcribed words and their associated metadata.
        """

        if not os.path.exists(audio_path):
            raise LeopardIOError("Could not find the audio file at `%s`" % audio_path)

        c_transcript = c_char_p()
        num_words = c_int32()
        c_words = POINTER(self.CWord)()
        status = self._process_file_func(
            self._handle,
            audio_path.encode(),
            byref(c_transcript),
            byref(num_words),
            byref(c_words))
        if status is not self.PicovoiceStatuses.SUCCESS:
            if status is self.PicovoiceStatuses.INVALID_ARGUMENT:
                if not audio_path.lower().endswith(self._VALID_EXTENSIONS):
                    raise self._PICOVOICE_STATUS_TO_EXCEPTION[status](
                        "Specified file with extension '%s' is not supported" % pathlib.Path(audio_path).suffix
                    )
            raise self._PICOVOICE_STATUS_TO_EXCEPTION[status]()

        transcript = c_transcript.value.decode('utf-8')
        self._transcript_delete_func(c_transcript)

        words = list()
        for i in range(num_words.value):
            word = self.Word(
                word=c_words[i].word.decode('utf-8'),
                start_sec=c_words[i].start_sec,
                end_sec=c_words[i].end_sec,
                confidence=c_words[i].confidence)
            words.append(word)

        self._words_delete_func(c_words)

        return transcript, words

    def delete(self) -> None:
        """Releases resources acquired by Leopard."""

        self._delete_func(self._handle)

    @property
    def version(self) -> str:
        """Version."""

        return self._version

    @property
    def sample_rate(self) -> int:
        """Audio sample rate accepted by `.process`."""

        return self._sample_rate


__all__ = [
    'Leopard',
    'LeopardActivationError',
    'LeopardActivationLimitError',
    'LeopardActivationRefusedError',
    'LeopardActivationThrottledError',
    'LeopardError',
    'LeopardIOError',
    'LeopardInvalidArgumentError',
    'LeopardInvalidStateError',
    'LeopardKeyError',
    'LeopardMemoryError',
    'LeopardRuntimeError',
    'LeopardStopIterationError',
]
