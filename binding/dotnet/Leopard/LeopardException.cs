/*
    Copyright 2022-2023 Picovoice Inc.

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
        private readonly string[] _messageStack;

        public LeopardException() { }

        public LeopardException(string message) : base(message) { }

        public LeopardException(string message, string[] messageStack) : base(ModifyMessages(message, messageStack))
        {
            this._messageStack = messageStack;
        }

        public string[] MessageStack
        {
            get => _messageStack;
        }

        private static string ModifyMessages(string message, string[] messageStack)
        {
            string messageString = message;
            if (messageStack.Length > 0)
            {
                messageString += ":";
                for (int i = 0; i < messageStack.Length; i++)
                {
                    messageString += $"\n  [{i}] {messageStack[i]}";
                }
            }
            return messageString;
        }
    }

    public class LeopardMemoryException : LeopardException
    {
        public LeopardMemoryException() { }

        public LeopardMemoryException(string message) : base(message) { }

        public LeopardMemoryException(string message, string[] messageStack) : base(message, messageStack) { }
    }

    public class LeopardIOException : LeopardException
    {
        public LeopardIOException() { }

        public LeopardIOException(string message) : base(message) { }

        public LeopardIOException(string message, string[] messageStack) : base(message, messageStack) { }
    }

    public class LeopardInvalidArgumentException : LeopardException
    {
        public LeopardInvalidArgumentException() { }

        public LeopardInvalidArgumentException(string message) : base(message) { }

        public LeopardInvalidArgumentException(string message, string[] messageStack) : base(message, messageStack) { }
    }

    public class LeopardStopIterationException : LeopardException
    {
        public LeopardStopIterationException() { }

        public LeopardStopIterationException(string message) : base(message) { }

        public LeopardStopIterationException(string message, string[] messageStack) : base(message, messageStack) { }
    }

    public class LeopardKeyException : LeopardException
    {
        public LeopardKeyException() { }

        public LeopardKeyException(string message) : base(message) { }

        public LeopardKeyException(string message, string[] messageStack) : base(message, messageStack) { }
    }

    public class LeopardInvalidStateException : LeopardException
    {
        public LeopardInvalidStateException() { }

        public LeopardInvalidStateException(string message) : base(message) { }

        public LeopardInvalidStateException(string message, string[] messageStack) : base(message, messageStack) { }
    }

    public class LeopardRuntimeException : LeopardException
    {
        public LeopardRuntimeException() { }

        public LeopardRuntimeException(string message) : base(message) { }

        public LeopardRuntimeException(string message, string[] messageStack) : base(message, messageStack) { }
    }

    public class LeopardActivationException : LeopardException
    {
        public LeopardActivationException() { }

        public LeopardActivationException(string message) : base(message) { }

        public LeopardActivationException(string message, string[] messageStack) : base(message, messageStack) { }
    }

    public class LeopardActivationLimitException : LeopardException
    {
        public LeopardActivationLimitException() { }

        public LeopardActivationLimitException(string message) : base(message) { }

        public LeopardActivationLimitException(string message, string[] messageStack) : base(message, messageStack) { }
    }

    public class LeopardActivationThrottledException : LeopardException
    {
        public LeopardActivationThrottledException() { }

        public LeopardActivationThrottledException(string message) : base(message) { }

        public LeopardActivationThrottledException(string message, string[] messageStack) : base(message, messageStack) { }
    }

    public class LeopardActivationRefusedException : LeopardException
    {
        public LeopardActivationRefusedException() { }

        public LeopardActivationRefusedException(string message) : base(message) { }

        public LeopardActivationRefusedException(string message, string[] messageStack) : base(message, messageStack) { }
    }

}