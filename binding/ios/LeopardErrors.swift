//
//  Copyright 2022 Picovoice Inc.
//  You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
//  file accompanying this source.
//  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
//  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
//  specific language governing permissions and limitations under the License.
//

public class LeopardError : LocalizedError {
    private let message: String;

    public init (_ message: String) {
        self.message = message
    }

    public var errorDescription: String? {
        return message
    }

    public var name: String {
        get {
            return String(describing: type(of: self))
        }
    }
}

public class LeopardMemoryError: LeopardError {}

public class LeopardIOError: LeopardError {}

public class LeopardInvalidArgumentError: LeopardError {}

public class LeopardStopIterationError: LeopardError {}

public class LeopardKeyError: LeopardError {}

public class LeopardInvalidStateError: LeopardError {}

public class LeopardRuntimeError: LeopardError {}

public class LeopardActivationError: LeopardError {}

public class LeopardActivationLimitError: LeopardError {}

public class LeopardActivationThrottledError: LeopardError {}

public class LeopardActivationRefusedError: LeopardError {}
