#
# Copyright 2022 Picovoice Inc.
#
# You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
# file accompanying this source.
#
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
# an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
# specific language governing permissions and limitations under the License.
#

from typing import *

from .leopard import Leopard
from .leopard import LeopardActivationError
from .leopard import LeopardActivationLimitError
from .leopard import LeopardActivationRefusedError
from .leopard import LeopardActivationThrottledError
from .leopard import LeopardError
from .leopard import LeopardIOError
from .leopard import LeopardInvalidArgumentError
from .leopard import LeopardInvalidStateError
from .leopard import LeopardKeyError
from .leopard import LeopardMemoryError
from .leopard import LeopardRuntimeError
from .leopard import LeopardStopIterationError
from .util import *


def create(access_key: str, library_path: Optional[str] = None, model_path: Optional[str] = None) -> Leopard:
    """
    Factory method for Leopard speech-to-text engine.

    :param access_key: AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)
    :param library_path: Absolute path to Leopard's dynamic library. If not set it will be set to the default location.
    :param model_path: Absolute path to the file containing model parameters. If not set it will be set to the default
    location.
    :return: An instance of Leopard speech-to-text engine.
    """

    if library_path is None:
        library_path = default_library_path('')

    if model_path is None:
        model_path = default_model_path('')

    return Leopard(access_key=access_key, library_path=library_path, model_path=model_path)
