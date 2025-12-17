/*
    Copyright 2022-2025 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is
    located in the "LICENSE" file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the
    License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
    express or implied. See the License for the specific language governing permissions and
    limitations under the License.
*/

package ai.picovoice.leopard;

class LeopardNative {

    static native int getSampleRate();

    static native String getVersion();

    static native void setSdk(String sdk);

    static native long init(
            String accessKey,
            String modelPath,
            String device,
            boolean enableAutomaticPunctuation,
            boolean enableDiarization) throws LeopardException;

    static native void delete(long object);

    static native LeopardTranscript process(
            long object,
            short[] pcm,
            int numSamples) throws LeopardException;

    static native LeopardTranscript processFile(
            long object,
            String path) throws LeopardException;

    static native String[] listHardwareDevices() throws LeopardException;
}
