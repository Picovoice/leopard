#
# Copyright 2023-2025 Picovoice Inc.
#
# You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
# file accompanying this source.
#
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
# an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
# specific language governing permissions and limitations under the License.
#

from typing import *

from ._leopard import (
    Leopard,
    list_hardware_devices
)
from ._util import (
    default_library_path,
    default_model_path
)


def create(
        access_key: str,
        model_path: Optional[str] = None,
        device: Optional[str] = None,
        library_path: Optional[str] = None,
        enable_automatic_punctuation: bool = False,
        enable_diarization: bool = False) -> Leopard:
    """
    Factory method for Leopard speech-to-text engine.

    :param access_key: AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)
    :param model_path: Absolute path to the file containing model parameters. If not set it will be set to the default
    location.
    :param device: String representation of the device (e.g., CPU or GPU) to use. If set to `best`, the most
    suitable device is selected automatically. If set to `gpu`, the engine uses the first available GPU device.
    To select a specific GPU device, set this argument to `gpu:${GPU_INDEX}`, where `${GPU_INDEX}` is the index
    of the target GPU. If set to`cpu`, the engine will run on the CPU with the default number of threads. To
    specify the number of threads, set this argument to `cpu:${NUM_THREADS}`, where `${NUM_THREADS}` is the
    desired number of threads.
    :param library_path: Absolute path to Leopard's dynamic library. If not set it will be set to the default location.
    :param enable_automatic_punctuation Set to `True` to enable automatic punctuation insertion.
    :param enable_diarization Set to `true` to enable speaker diarization, which allows Leopard to differentiate
    speakers as part of the transcription process. Word metadata will include a `speaker_tag` to
    identify unique speakers.
    :return: An instance of Leopard speech-to-text engine.
    """

    if model_path is None:
        model_path = default_model_path('')

    if library_path is None:
        library_path = default_library_path('')

    if device is None:
        device = "best"

    return Leopard(
        access_key=access_key,
        model_path=model_path,
        device=device,
        library_path=library_path,
        enable_automatic_punctuation=enable_automatic_punctuation,
        enable_diarization=enable_diarization)


def available_devices(library_path: Optional[str] = None) -> Sequence[str]:
    """
    Lists all available devices that Leopard can use for inference. Each entry in the list can be the `device` argument
    of `.create` factory method or `Leopard` constructor.

    :param library_path: Absolute path to Leopard's dynamic library. If not set it will be set to the default location.

    :return: List of all available devices that Leopard can use for inference.
    """

    if library_path is None:
        library_path = default_library_path()

    return list_hardware_devices(library_path=library_path)


__all__ = [
    'available_devices',
    'create',
]
