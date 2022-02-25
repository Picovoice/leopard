/*
    Copyright 2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
*/

using System;

namespace Pv
{
    public class LeopardException : Exception
    {
        public LeopardException() { }

        public LeopardException(string message) : base(message) { }

    }

    public class LeopardMemoryException : LeopardException
    {
        public LeopardMemoryException() { }

        public LeopardMemoryException(string message) : base(message) { }
    }

    public class LeopardIOException : LeopardException
    {
        public LeopardIOException() { }

        public LeopardIOException(string message) : base(message) { }
    }

    public class LeopardInvalidArgumentException : LeopardException
    {
        public LeopardInvalidArgumentException() { }

        public LeopardInvalidArgumentException(string message) : base(message) { }
    }

    public class LeopardStopIterationException : LeopardException
    {
        public LeopardStopIterationException() { }

        public LeopardStopIterationException(string message) : base(message) { }
    }

    public class LeopardKeyException : LeopardException
    {
        public LeopardKeyException() { }

        public LeopardKeyException(string message) : base(message) { }
    }

    public class LeopardInvalidStateException : LeopardException
    {
        public LeopardInvalidStateException() { }

        public LeopardInvalidStateException(string message) : base(message) { }
    }

    public class LeopardRuntimeException : LeopardException
    {
        public LeopardRuntimeException() { }

        public LeopardRuntimeException(string message) : base(message) { }
    }

    public class LeopardActivationException : LeopardException
    {
        public LeopardActivationException() { }

        public LeopardActivationException(string message) : base(message) { }
    }

    public class LeopardActivationLimitException : LeopardException
    {
        public LeopardActivationLimitException() { }

        public LeopardActivationLimitException(string message) : base(message) { }
    }

    public class LeopardActivationThrottledException : LeopardException
    {
        public LeopardActivationThrottledException() { }

        public LeopardActivationThrottledException(string message) : base(message) { }
    }

    public class LeopardActivationRefusedException : LeopardException
    {
        public LeopardActivationRefusedException() { }

        public LeopardActivationRefusedException(string message) : base(message) { }
    }

}
