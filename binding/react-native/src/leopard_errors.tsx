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

class LeopardError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "LeopardError";
    }
}

class LeopardMemoryError extends LeopardError {
    constructor(message: string) {
        super(message);
        this.name = "LeopardMemoryError";
    }
}

class LeopardIOError extends LeopardError {
    constructor(message: string) {
        super(message);
        this.name = "LeopardIOError";
    }
}

class LeopardInvalidArgumentError extends LeopardError {
    constructor(message: string) {
        super(message);
        this.name = "LeopardInvalidArgumentError";
    }
}

class LeopardStopIterationError extends LeopardError {
    constructor(message: string) {
        super(message);
        this.name = "LeopardStopIterationError";
    }
}

class LeopardKeyError extends LeopardError {
    constructor(message: string) {
        super(message);
        this.name = "LeopardKeyError";
    }
}

class LeopardInvalidStateError extends LeopardError {
    constructor(message: string) {
        super(message);
        this.name = "LeopardInvalidStateError";
    }
}

class LeopardRuntimeError extends LeopardError {
    constructor(message: string) {
        super(message);
        this.name = "LeopardRuntimeError";
    }
}

class LeopardActivationError extends LeopardError {
    constructor(message: string) {
        super(message);
        this.name = "LeopardActivationError";
    }
}

class LeopardActivationLimitError extends LeopardError {
    constructor(message: string) {
        super(message);
        this.name = "LeopardActivationLimitError";
    }
}

class LeopardActivationThrottledError extends LeopardError {
    constructor(message: string) {
        super(message);
        this.name = "LeopardActivationThrottledError";
    }
}

class LeopardActivationRefusedError extends LeopardError {
    constructor(message: string) {
        super(message);
        this.name = "LeopardActivationRefusedError";
    }
}

export {
    LeopardError,
    LeopardMemoryError,
    LeopardIOError,
    LeopardInvalidArgumentError,
    LeopardStopIterationError,
    LeopardKeyError,
    LeopardInvalidStateError,
    LeopardRuntimeError,
    LeopardActivationError,
    LeopardActivationLimitError,
    LeopardActivationThrottledError,
    LeopardActivationRefusedError
};
