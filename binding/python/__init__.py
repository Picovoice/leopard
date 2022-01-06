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
from .util import *

LIBRARY_PATH = pv_library_path('')

MODEL_PATH = pv_model_path('')


def create(access_key: str, library_path: Optional[str] = None, model_path: Optional[str] = None) -> Leopard:
    if library_path is None:
        library_path = LIBRARY_PATH

    if model_path is None:
        model_path = MODEL_PATH

    return Leopard(access_key=access_key, library_path=library_path, model_path=model_path)
