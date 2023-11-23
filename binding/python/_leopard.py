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
    def __init__(self, message: str = '', message_stack: Sequence[str] = None):
        super().__init__(message)

        self._message = message
        self._message_stack = list() if message_stack is None else message_stack

    def __str__(self):
        message = self._message
        if len(self._message_stack) > 0:
            message += ':'
            for i in range(len(self._message_stack)):
                message += '\n  [%d] %s' % (i, self._message_stack[i])
        return message

    @property
    def message(self) -> str:
        return self._message

    @property
    def message_stack(self) -> Sequence[str]:
        return self._message_stack


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
            ("confidence", c_float),
            ("speaker_tag", c_int32)]

    def __init__(
            self,
            access_key: str,
            model_path: str,
            library_path: str,
            enable_automatic_punctuation: bool = False,
            enable_diarization: bool = False) -> None:
        """
        Constructor.

        :param access_key: AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)
        :param model_path: Absolute path to the file containing model parameters.
        :param library_path: Absolute path to Leopard's dynamic library.
        :param enable_automatic_punctuation Set to `True` to enable automatic punctuation insertion.
        :param enable_diarization Set to `true` to enable speaker diarization, which allows Leopard to differentiate
        speakers as part of the transcription process. Word metadata will include a `speaker_tag` to
        identify unique speakers.
        """

        if not isinstance(access_key, str) or len(access_key) == 0:
            raise LeopardInvalidArgumentError("`access_key` should be a non-empty string.")

        if not os.path.exists(model_path):
            raise LeopardIOError("Could not find model file at `%s`." % model_path)

        if not os.path.exists(library_path):
            raise LeopardIOError("Could not find Leopard's dynamic library at `%s`." % library_path)

        library = cdll.LoadLibrary(library_path)

        set_sdk_func = library.pv_set_sdk
        set_sdk_func.argtypes = [c_char_p]
        set_sdk_func.restype = None

        set_sdk_func('python'.encode('utf-8'))

        self._get_error_stack_func = library.pv_get_error_stack
        self._get_error_stack_func.argtypes = [POINTER(POINTER(c_char_p)), POINTER(c_int)]
        self._get_error_stack_func.restype = self.PicovoiceStatuses

        self._free_error_stack_func = library.pv_free_error_stack
        self._free_error_stack_func.argtypes = [POINTER(c_char_p)]
        self._free_error_stack_func.restype = None

        init_func = library.pv_leopard_init
        init_func.argtypes = [c_char_p, c_char_p, c_bool, c_bool, POINTER(POINTER(self.CLeopard))]
        init_func.restype = self.PicovoiceStatuses

        self._handle = POINTER(self.CLeopard)()

        status = init_func(
            access_key.encode(),
            model_path.encode(),
            enable_automatic_punctuation,
            enable_diarization,
            byref(self._handle))
        if status is not self.PicovoiceStatuses.SUCCESS:
            raise self._PICOVOICE_STATUS_TO_EXCEPTION[status](
                message='Initialization failed',
                message_stack=self._get_error_stack())

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

    Word = namedtuple('Word', ['word', 'start_sec', 'end_sec', 'confidence', 'speaker_tag'])

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
            raise self._PICOVOICE_STATUS_TO_EXCEPTION[status](
                message='Process failed',
                message_stack=self._get_error_stack())

        transcript = c_transcript.value.decode('utf-8')
        self._transcript_delete_func(c_transcript)

        words = list()
        for i in range(num_words.value):
            word = self.Word(
                word=c_words[i].word.decode('utf-8'),
                start_sec=c_words[i].start_sec,
                end_sec=c_words[i].end_sec,
                confidence=c_words[i].confidence,
                speaker_tag=c_words[i].speaker_tag)
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
            raise self._PICOVOICE_STATUS_TO_EXCEPTION[status](
                message='Process file failed',
                message_stack=self._get_error_stack())

        transcript = c_transcript.value.decode('utf-8')
        self._transcript_delete_func(c_transcript)

        words = list()
        for i in range(num_words.value):
            word = self.Word(
                word=c_words[i].word.decode('utf-8'),
                start_sec=c_words[i].start_sec,
                end_sec=c_words[i].end_sec,
                confidence=c_words[i].confidence,
                speaker_tag=c_words[i].speaker_tag)
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

    def _get_error_stack(self) -> Sequence[str]:
        message_stack_ref = POINTER(c_char_p)()
        message_stack_depth = c_int()
        status = self._get_error_stack_func(byref(message_stack_ref), byref(message_stack_depth))
        if status is not self.PicovoiceStatuses.SUCCESS:
            raise self._PICOVOICE_STATUS_TO_EXCEPTION[status](message='Unable to get Leopard error state')

        message_stack = list()
        for i in range(message_stack_depth.value):
            message_stack.append(message_stack_ref[i].decode('utf-8'))

        self._free_error_stack_func(message_stack_ref)

        return message_stack


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
