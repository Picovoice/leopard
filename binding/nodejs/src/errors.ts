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

export class LeopardError extends Error {
  private readonly _message: string;
  private readonly _messageStack: string[];

  constructor(message: string, messageStack: string[] = []) {
    super(LeopardError.errorToString(message, messageStack));
    this._message = message;
    this._messageStack = messageStack;
  }

  get message(): string {
    return this._message;
  }

  get messageStack(): string[] {
    return this._messageStack;
  }

  private static errorToString(
    initial: string,
    messageStack: string[]
  ): string {
    let msg = initial;

    if (messageStack.length > 0) {
      msg += `: ${messageStack.reduce(
        (acc, value, index) => acc + '\n  [' + index + '] ' + value,
        ''
      )}`;
    }

    return msg;
  }
}

export class LeopardOutOfMemoryError extends LeopardError {}
export class LeopardIOError extends LeopardError {}
export class LeopardInvalidArgumentError extends LeopardError {}
export class LeopardStopIterationError extends LeopardError {}
export class LeopardKeyError extends LeopardError {}
export class LeopardInvalidStateError extends LeopardError {}
export class LeopardRuntimeError extends LeopardError {}
export class LeopardActivationError extends LeopardError {}
export class LeopardActivationLimitReachedError extends LeopardError {}
export class LeopardActivationThrottledError extends LeopardError {}
export class LeopardActivationRefusedError extends LeopardError {}

export function pvStatusToException(
  pvStatus: PvStatus,
  errorMessage: string,
  messageStack: string[] = []
): void {
  switch (pvStatus) {
    case PvStatus.OUT_OF_MEMORY:
      throw new LeopardOutOfMemoryError(errorMessage, messageStack);
    case PvStatus.IO_ERROR:
      throw new LeopardIOError(errorMessage, messageStack);
    case PvStatus.INVALID_ARGUMENT:
      throw new LeopardInvalidArgumentError(errorMessage, messageStack);
    case PvStatus.STOP_ITERATION:
      throw new LeopardStopIterationError(errorMessage, messageStack);
    case PvStatus.KEY_ERROR:
      throw new LeopardKeyError(errorMessage, messageStack);
    case PvStatus.INVALID_STATE:
      throw new LeopardInvalidStateError(errorMessage, messageStack);
    case PvStatus.RUNTIME_ERROR:
      throw new LeopardRuntimeError(errorMessage, messageStack);
    case PvStatus.ACTIVATION_ERROR:
      throw new LeopardActivationError(errorMessage, messageStack);
    case PvStatus.ACTIVATION_LIMIT_REACHED:
      throw new LeopardActivationLimitReachedError(errorMessage, messageStack);
    case PvStatus.ACTIVATION_THROTTLED:
      throw new LeopardActivationThrottledError(errorMessage, messageStack);
    case PvStatus.ACTIVATION_REFUSED:
      throw new LeopardActivationRefusedError(errorMessage, messageStack);
    default:
      // eslint-disable-next-line no-console
      console.warn(`Unmapped error code: ${pvStatus}`);
      throw new LeopardError(errorMessage);
  }
}
