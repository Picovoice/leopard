//
// Copyright 2023 Picovoice Inc.
//
// You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
// file accompanying this source.
//
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
// an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.
//

import { PvError } from '@picovoice/web-utils';
import { PvStatus } from './types';

class LeopardError extends Error {
  private readonly _status: PvStatus;
  private readonly _shortMessage: string;
  private readonly _messageStack: string[];

  constructor(
    status: PvStatus,
    message: string,
    messageStack: string[] = [],
    pvError: PvError | null = null
  ) {
    super(LeopardError.errorToString(message, messageStack, pvError));
    this._status = status;
    this.name = 'LeopardError';
    this._shortMessage = message;
    this._messageStack = messageStack;
  }

  get status(): PvStatus {
    return this._status;
  }

  get shortMessage(): string {
    return this._shortMessage;
  }

  get messageStack(): string[] {
    return this._messageStack;
  }

  private static errorToString(
    initial: string,
    messageStack: string[],
    pvError: PvError | null = null
  ): string {
    let msg = initial;

    if (pvError) {
      const pvErrorMessage = pvError.getErrorString();
      if (pvErrorMessage.length > 0) {
        msg += `\nDetails: ${pvErrorMessage}`;
      }
    }

    if (messageStack.length > 0) {
      msg += `: ${messageStack.reduce(
        (acc, value, index) => acc + '\n  [' + index + '] ' + value,
        ''
      )}`;
    }

    return msg;
  }
}

class LeopardOutOfMemoryError extends LeopardError {
  constructor(
    message: string,
    messageStack?: string[],
    pvError: PvError | null = null
  ) {
    super(PvStatus.OUT_OF_MEMORY, message, messageStack, pvError);
    this.name = 'LeopardOutOfMemoryError';
  }
}

class LeopardIOError extends LeopardError {
  constructor(
    message: string,
    messageStack: string[] = [],
    pvError: PvError | null = null
  ) {
    super(PvStatus.IO_ERROR, message, messageStack, pvError);
    this.name = 'LeopardIOError';
  }
}

class LeopardInvalidArgumentError extends LeopardError {
  constructor(
    message: string,
    messageStack: string[] = [],
    pvError: PvError | null = null
  ) {
    super(PvStatus.INVALID_ARGUMENT, message, messageStack, pvError);
    this.name = 'LeopardInvalidArgumentError';
  }
}

class LeopardStopIterationError extends LeopardError {
  constructor(
    message: string,
    messageStack: string[] = [],
    pvError: PvError | null = null
  ) {
    super(PvStatus.STOP_ITERATION, message, messageStack, pvError);
    this.name = 'LeopardStopIterationError';
  }
}

class LeopardKeyError extends LeopardError {
  constructor(
    message: string,
    messageStack: string[] = [],
    pvError: PvError | null = null
  ) {
    super(PvStatus.KEY_ERROR, message, messageStack, pvError);
    this.name = 'LeopardKeyError';
  }
}

class LeopardInvalidStateError extends LeopardError {
  constructor(
    message: string,
    messageStack: string[] = [],
    pvError: PvError | null = null
  ) {
    super(PvStatus.INVALID_STATE, message, messageStack, pvError);
    this.name = 'LeopardInvalidStateError';
  }
}

class LeopardRuntimeError extends LeopardError {
  constructor(
    message: string,
    messageStack: string[] = [],
    pvError: PvError | null = null
  ) {
    super(PvStatus.RUNTIME_ERROR, message, messageStack, pvError);
    this.name = 'LeopardRuntimeError';
  }
}

class LeopardActivationError extends LeopardError {
  constructor(
    message: string,
    messageStack: string[] = [],
    pvError: PvError | null = null
  ) {
    super(PvStatus.ACTIVATION_ERROR, message, messageStack, pvError);
    this.name = 'LeopardActivationError';
  }
}

class LeopardActivationLimitReachedError extends LeopardError {
  constructor(
    message: string,
    messageStack: string[] = [],
    pvError: PvError | null = null
  ) {
    super(PvStatus.ACTIVATION_LIMIT_REACHED, message, messageStack, pvError);
    this.name = 'LeopardActivationLimitReachedError';
  }
}

class LeopardActivationThrottledError extends LeopardError {
  constructor(
    message: string,
    messageStack: string[] = [],
    pvError: PvError | null = null
  ) {
    super(PvStatus.ACTIVATION_THROTTLED, message, messageStack, pvError);
    this.name = 'LeopardActivationThrottledError';
  }
}

class LeopardActivationRefusedError extends LeopardError {
  constructor(
    message: string,
    messageStack: string[] = [],
    pvError: PvError | null = null
  ) {
    super(PvStatus.ACTIVATION_REFUSED, message, messageStack, pvError);
    this.name = 'LeopardActivationRefusedError';
  }
}

export {
  LeopardError,
  LeopardOutOfMemoryError,
  LeopardIOError,
  LeopardInvalidArgumentError,
  LeopardStopIterationError,
  LeopardKeyError,
  LeopardInvalidStateError,
  LeopardRuntimeError,
  LeopardActivationError,
  LeopardActivationLimitReachedError,
  LeopardActivationThrottledError,
  LeopardActivationRefusedError,
};

export function pvStatusToException(
  pvStatus: PvStatus,
  errorMessage: string,
  messageStack: string[] = [],
  pvError: PvError | null = null
): LeopardError {
  switch (pvStatus) {
    case PvStatus.OUT_OF_MEMORY:
      return new LeopardOutOfMemoryError(errorMessage, messageStack, pvError);
    case PvStatus.IO_ERROR:
      return new LeopardIOError(errorMessage, messageStack, pvError);
    case PvStatus.INVALID_ARGUMENT:
      return new LeopardInvalidArgumentError(
        errorMessage,
        messageStack,
        pvError
      );
    case PvStatus.STOP_ITERATION:
      return new LeopardStopIterationError(errorMessage, messageStack, pvError);
    case PvStatus.KEY_ERROR:
      return new LeopardKeyError(errorMessage, messageStack, pvError);
    case PvStatus.INVALID_STATE:
      return new LeopardInvalidStateError(errorMessage, messageStack, pvError);
    case PvStatus.RUNTIME_ERROR:
      return new LeopardRuntimeError(errorMessage, messageStack, pvError);
    case PvStatus.ACTIVATION_ERROR:
      return new LeopardActivationError(errorMessage, messageStack, pvError);
    case PvStatus.ACTIVATION_LIMIT_REACHED:
      return new LeopardActivationLimitReachedError(
        errorMessage,
        messageStack,
        pvError
      );
    case PvStatus.ACTIVATION_THROTTLED:
      return new LeopardActivationThrottledError(
        errorMessage,
        messageStack,
        pvError
      );
    case PvStatus.ACTIVATION_REFUSED:
      return new LeopardActivationRefusedError(
        errorMessage,
        messageStack,
        pvError
      );
    default:
      // eslint-disable-next-line no-console
      console.warn(`Unmapped error code: ${pvStatus}`);
      return new LeopardError(pvStatus, errorMessage);
  }
}
