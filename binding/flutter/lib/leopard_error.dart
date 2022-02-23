//
// Copyright 2022 Picovoice Inc.
//
// You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
// file accompanying this source.
//
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
// an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.
//

class LeopardException implements Exception {
  final String? message;
  LeopardException([this.message]);
}

class LeopardMemoryException extends LeopardException {
  LeopardMemoryException(String? message) : super(message);
}

class LeopardIOException extends LeopardException {
  LeopardIOException(String? message) : super(message);
}

class LeopardInvalidArgumentException extends LeopardException {
  LeopardInvalidArgumentException(String? message) : super(message);
}

class LeopardStopIterationException extends LeopardException {
  LeopardStopIterationException(String? message) : super(message);
}

class LeopardKeyException extends LeopardException {
  LeopardKeyException(String? message) : super(message);
}

class LeopardInvalidStateException extends LeopardException {
  LeopardInvalidStateException(String? message) : super(message);
}

class LeopardRuntimeException extends LeopardException {
  LeopardRuntimeException(String? message) : super(message);
}

class LeopardActivationException extends LeopardException {
  LeopardActivationException(String? message) : super(message);
}

class LeopardActivationLimitException extends LeopardException {
  LeopardActivationLimitException(String? message) : super(message);
}

class LeopardActivationThrottledException extends LeopardException {
  LeopardActivationThrottledException(String? message) : super(message);
}

class LeopardActivationRefusedException extends LeopardException {
  LeopardActivationRefusedException(String? message) : super(message);
}

leopardStatusToException(String code, String? message) {
  switch (code) {
    case 'LeopardException':
      return LeopardException(message);
    case 'LeopardMemoryException':
      return LeopardMemoryException(message);
    case 'LeopardIOException':
      return LeopardIOException(message);
    case 'LeopardInvalidArgumentException':
      return LeopardInvalidArgumentException(message);
    case 'LeopardStopIterationException':
      return LeopardStopIterationException(message);
    case 'LeopardKeyException':
      return LeopardKeyException(message);
    case 'LeopardInvalidStateException':
      return LeopardInvalidStateException(message);
    case 'LeopardRuntimeException':
      return LeopardRuntimeException(message);
    case 'LeopardActivationException':
      return LeopardActivationException(message);
    case 'LeopardActivationLimitException':
      return LeopardActivationLimitException(message);
    case 'LeopardActivationThrottledException':
      return LeopardActivationThrottledException(message);
    case 'LeopardActivationRefusedException':
      return LeopardActivationRefusedException(message);
    default:
      return LeopardException("unexpected code: $code, message: $message");
  }
}
