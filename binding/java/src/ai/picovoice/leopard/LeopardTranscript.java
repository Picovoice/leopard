/*
    Copyright 2022-2023 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is
    located in the "LICENSE" file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the
    License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
    express or implied. See the License for the specific language governing permissions and
    limitations under the License.
*/

package ai.picovoice.leopard;

/**
 * Class that contains transcription results returned from Leopard.
 */
public class LeopardTranscript {

    private final String transcriptString;
    private final Word[] wordArray;

    /**
     * Constructor.
     *
     * @param transcriptString Inferred transcription.
     * @param wordArray        Transcribed words and their associated metadata.
     */
    public LeopardTranscript(String transcriptString, Word[] wordArray) {
        this.transcriptString = transcriptString;
        this.wordArray = wordArray;
    }

    /**
     * Getter for the inferred transcription.
     *
     * @return Inferred transcription.
     */
    public String getTranscriptString() {
        return transcriptString;
    }

    /**
     * Getter for transcribed words and their associated metadata.
     *
     * @return Transcribed words and their associated metadata.
     */
    public Word[] getWordArray() {
        return wordArray;
    }

    /**
     * Class for storing word metadata.
     */
    public static class Word {
        private final String word;
        private final float confidence;
        private final float startSec;
        private final float endSec;
        private final int speakerTag;

        /**
         * Constructor.
         *
         * @param word       Transcribed word.
         * @param confidence Transcription confidence. It is a number within [0, 1].
         * @param startSec   Start of word in seconds.
         * @param endSec     End of word in seconds.
         * @param speakerTag The speaker tag is `-1` if diarization is not enabled during initialization;
         *                   otherwise, it's a non-negative integer identifying unique speakers, with `0` reserved
         *                   for unknown speakers
         */
        public Word(
                String word,
                float confidence,
                float startSec,
                float endSec,
                int speakerTag) {
            this.word = word;
            this.confidence = confidence;
            this.startSec = startSec;
            this.endSec = endSec;
            this.speakerTag = speakerTag;
        }

        /**
         * Getter for the transcribed word.
         *
         * @return Transcribed word.
         */
        public String getWord() {
            return word;
        }

        /**
         * Getter for the transcription confidence.
         *
         * @return Transcription confidence. It is a number within [0, 1].
         */
        public float getConfidence() {
            return confidence;
        }

        /**
         * Getter for the start of word in seconds.
         *
         * @return Start of word in seconds.
         */
        public float getStartSec() {
            return startSec;
        }

        /**
         * Getter for the end of word in seconds.
         *
         * @return End of word in seconds.
         */
        public float getEndSec() {
            return endSec;
        }

        /**
         * Getter for the speaker tag.
         *
         * @return Speaker tag.
         */
        public int getSpeakerTag() {
            return speakerTag;
        }
    }
}
