#
# Copyright 2023 Picovoice Inc.
#
# You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
# file accompanying this source.
#
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
# an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
# specific language governing permissions and limitations under the License.
#

import json
import os
import struct
import wave

from typing import *

from _leopard import *


def load_test_data() -> List[Tuple[str, str, str, List[str], float]]:
    data_file_path = os.path.join(os.path.dirname(__file__), "../../resources/.test/test_data.json")
    with open(data_file_path, encoding="utf8") as data_file:
        json_test_data = data_file.read()
    test_data = json.loads(json_test_data)['tests']

    language_tests = [
        (
            t['language'],
            t['audio_file'],
            t['transcript'],
            t['transcript_with_punctuation'],
            t['error_rate'],
            [
                Leopard.Word(
                    word=x['word'],
                    start_sec=x['start_sec'],
                    end_sec=x['end_sec'],
                    confidence=x['confidence'],
                    speaker_tag=x['speaker_tag'])
                for x in t['words']
            ]
        )
        for t in test_data['language_tests']
    ]

    diarization_tests = [
        (
            t['language'],
            t['audio_file'],
            [
                Leopard.Word(
                    word=x['word'],
                    start_sec=0,
                    end_sec=0,
                    confidence=0,
                    speaker_tag=x['speaker_tag'])
                for x in t['words']
            ]
        )
        for t in test_data['diarization_tests']
    ]

    return language_tests, diarization_tests


def read_wav_file(file_name: str, sample_rate: int) -> Tuple:
    wav_file = wave.open(file_name, mode="rb")
    channels = wav_file.getnchannels()
    num_frames = wav_file.getnframes()

    if wav_file.getframerate() != sample_rate:
        raise ValueError(
            "Audio file should have a sample rate of %d, got %d" % (sample_rate, wav_file.getframerate()))

    samples = wav_file.readframes(num_frames)
    wav_file.close()

    frames = struct.unpack('h' * num_frames * channels, samples)

    if channels == 2:
        print("Picovoice processes single-channel audio but stereo file is provided. Processing left channel only.")

    return frames[::channels]


def get_model_path_by_language(language: str) -> str:
    model_path_subdir = _append_language('../../lib/common/leopard_params', language)
    return os.path.join(os.path.dirname(__file__), '%s.pv' % model_path_subdir)


def get_word_error_rate(transcript: str, expected_transcript: str, use_cer: bool = False) -> float:
    transcript_split = list(transcript) if use_cer else transcript.split()
    expected_split = list(expected_transcript) if use_cer else expected_transcript.split()
    return _levenshtein_distance(transcript_split, expected_split) / len(transcript)


def _append_language(s: str, language: str) -> str:
    if language == 'en':
        return s
    return "%s_%s" % (s, language)


def _levenshtein_distance(words1: Sequence[str], words2: Sequence[str]) -> int:
    res = [[0] * (len(words1) + 2) for _ in range(len(words2) + 1)]
    for i in range(len(words1) + 1):
        res[i][0] = i
    for j in range(len(words2) + 1):
        res[0][j] = j

    for i in range(1, len(words1) + 1):
        for j in range(1, len(words2) + 1):
            res[i][j] = min(
                res[i - 1][j] + 1,
                res[i][j - 1] + 1,
                res[i - 1][j - 1] + (0 if words1[i - 1].upper() == words2[j - 1].upper() else 1)
            )

    return res[len(words1)][len(words2)]
