﻿/*
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
    /// <summary>
    /// Class for storing word metadata
    /// </summary>
    public class LeopardWord
    {
        /// <summary>
        /// Constructor.
        /// </summary>
        /// <param name="word">Transcribed word.</param>
        /// <param name="confidence">Transcription confidence. It is a number within [0, 1].</param>
        /// <param name="startSec">Start of word in seconds.</param>
        /// <param name="endSec">End of word in seconds.</param>
        /// <param name="speakerTag">
        /// The speaker tag is `-1` if diarization is not enabled during initialization; otherwise,
        /// it's a non-negative integer identifying unique speakers, with `0` reserved for unknown speakers.
        /// </param>
        public LeopardWord(
            string word,
            float confidence,
            float startSec,
            float endSec,
            Int32 speakerTag)
        {
            Word = word;
            Confidence = confidence;
            StartSec = startSec;
            EndSec = endSec;
            SpeakerTag = speakerTag;
        }

        /// <summary>
        /// Getter for word
        /// </summary>
        public string Word { get; }

        /// <summary>
        /// Getter for confidence.
        /// </summary>
        public float Confidence { get; }

        /// <summary>
        /// Getter for startSec.
        /// </summary>
        public float StartSec { get; }

        /// <summary>
        /// Getter for endSec.
        /// </summary>
        public float EndSec { get; }

        /// <summary>
        /// Getter for speakerTag.
        /// </summary>
        public Int32 SpeakerTag { get; }
    }

    /// <summary>
    /// Class that contains transcription results
    /// </summary>
    public class LeopardTranscript
    {
        /// <summary>
        /// Constructor.
        /// </summary>
        /// <param name="transcriptString">
        /// Transcript returned from Leopard.
        /// </param>
        /// <param name="wordArray">
        /// Transcribed words and their associated metadata.
        /// </param>
        public LeopardTranscript(string transcriptString, LeopardWord[] wordArray)
        {
            TranscriptString = transcriptString;
            WordArray = wordArray;
        }

        /// <summary>
        /// Getter for transcript.
        /// </summary>
        public string TranscriptString { get; }

        /// <summary>
        /// Getter for transcribed words and their associated metadata.
        /// </summary>
        public LeopardWord[] WordArray { get; }
    }
}