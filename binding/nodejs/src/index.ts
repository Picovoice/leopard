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

import { Leopard } from './leopard';

import {
  LeopardActivationError,
  LeopardActivationLimitReached,
  LeopardActivationRefused,
  LeopardActivationThrottled,
  LeopardError,
  LeopardInvalidArgumentError,
  LeopardInvalidStateError,
  LeopardIoError,
  LeopardKeyError,
  LeopardOutOfMemoryError,
  LeopardRuntimeError,
  LeopardStopIterationError,
} from './errors';

import {
  LeopardOptions,
  LeopardInitOptions,
  LeopardInputOptions,
  LeopardWord,
  LeopardTranscript,
} from './types';

export {
  Leopard,
  LeopardActivationError,
  LeopardActivationLimitReached,
  LeopardActivationRefused,
  LeopardActivationThrottled,
  LeopardOptions,
  LeopardError,
  LeopardInitOptions,
  LeopardInputOptions,
  LeopardInvalidArgumentError,
  LeopardInvalidStateError,
  LeopardIoError,
  LeopardKeyError,
  LeopardOutOfMemoryError,
  LeopardRuntimeError,
  LeopardStopIterationError,
  LeopardTranscript,
  LeopardWord,
};
