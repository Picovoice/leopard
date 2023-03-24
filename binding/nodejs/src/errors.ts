//
// Copyright 2022-2023 Picovoice Inc.
//
// You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
// file accompanying this source.
//
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
// an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.
//
'use strict';

import PvStatus from './pv_status_t';

export class LeopardError extends Error {}

export class LeopardOutOfMemoryError extends LeopardError {}
export class LeopardIoError extends LeopardError {}
export class LeopardInvalidArgumentError extends LeopardError {}
export class LeopardStopIterationError extends LeopardError {}
export class LeopardKeyError extends LeopardError {}
export class LeopardInvalidStateError extends LeopardError {}
export class LeopardRuntimeError extends LeopardError {}
export class LeopardActivationError extends LeopardError {}
export class LeopardActivationLimitReached extends LeopardError {}
export class LeopardActivationThrottled extends LeopardError {}
export class LeopardActivationRefused extends LeopardError {}

export function pvStatusToException(
  pvStatus: PvStatus,
  errorMessage: string
): void {
  switch (pvStatus) {
    case PvStatus.OUT_OF_MEMORY:
      throw new LeopardOutOfMemoryError(errorMessage);
    case PvStatus.IO_ERROR:
      throw new LeopardIoError(errorMessage);
    case PvStatus.INVALID_ARGUMENT:
      throw new LeopardInvalidArgumentError(errorMessage);
    case PvStatus.STOP_ITERATION:
      throw new LeopardStopIterationError(errorMessage);
    case PvStatus.KEY_ERROR:
      throw new LeopardKeyError(errorMessage);
    case PvStatus.INVALID_STATE:
      throw new LeopardInvalidStateError(errorMessage);
    case PvStatus.RUNTIME_ERROR:
      throw new LeopardRuntimeError(errorMessage);
    case PvStatus.ACTIVATION_ERROR:
      throw new LeopardActivationError(errorMessage);
    case PvStatus.ACTIVATION_LIMIT_REACHED:
      throw new LeopardActivationLimitReached(errorMessage);
    case PvStatus.ACTIVATION_THROTTLED:
      throw new LeopardActivationThrottled(errorMessage);
    case PvStatus.ACTIVATION_REFUSED:
      throw new LeopardActivationRefused(errorMessage);
    default:
      // eslint-disable-next-line no-console
      console.warn(`Unmapped error code: ${pvStatus}`);
      throw new LeopardError(errorMessage);
  }
}
