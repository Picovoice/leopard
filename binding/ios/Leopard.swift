//
//  Copyright 2022 Picovoice Inc.
//  You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
//  file accompanying this source.
//  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
//  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
//  specific language governing permissions and limitations under the License.
//

import PvLeopard

public struct LeopardWord {

    /// Transcribed word.
    public let word: String

    /// Start of word in seconds.
    public let startSec: Float

    /// End of word in seconds.
    public let endSec: Float

    /// Transcription confidence. It is a number within [0, 1].
    public let confidence: Float

    /// Constructor.
    ///
    /// - Parameters:
    ///   - word: Transcribed word.
    ///   - startSec: Start of word in seconds.
    ///   - endSec: End of word in seconds.
    ///   - confidence: Transcription confidence. It is a number within [0, 1].
    public init(word: String, startSec: Float, endSec: Float, confidence: Float) {
        self.word = word
        self.startSec = startSec
        self.endSec = endSec
        self.confidence = confidence
    }
}

/// iOS binding for Leopard speech-to-text engine. Provides a Swift interface to the Leopard library.
public class Leopard {
    private static let supportedAudioTypes: Set = [
        "3gp",
        "flac",
        "m4a",
        "mp3",
        "mp4",
        "ogg",
        "opus",
        "vorbis",
        "wav",
        "webm", ]

    private var handle: OpaquePointer?

    public static let sampleRate = UInt32(pv_sample_rate())
    public static let version = String(cString: pv_leopard_version())

    /// Constructor.
    ///
    /// - Parameters:
    ///   - accessKey: The AccessKey obtained from Picovoice Console (https://console.picovoice.ai).
    ///   - modelPath: Absolute path to file containing model parameters.
    ///   - enableAutomaticPunctuation: Set to `true` to enable automatic punctuation insertion.
    /// - Throws: LeopardError
    public init(accessKey: String, modelPath: String, enableAutomaticPunctuation: Bool = false) throws {

        if accessKey.count == 0 {
            throw LeopardInvalidArgumentError("AccessKey is required for Leopard initialization")
        }

        var modelPathArg = modelPath
        if !FileManager().fileExists(atPath: modelPathArg) {
            modelPathArg = try getResourcePath(modelPathArg)
        }

        let status = pv_leopard_init(
                accessKey,
                modelPathArg,
                enableAutomaticPunctuation,
                &handle)
        try checkStatus(status, "Leopard init failed")
    }

    /// Constructor.
    ///
    /// - Parameters:
    ///   - accessKey: The AccessKey obtained from Picovoice Console (https://console.picovoice.ai).
    ///   - modelURL: URL file containing model parameters.
    ///   - enableAutomaticPunctuation: Set to `true` to enable automatic punctuation insertion.
    /// - Throws: LeopardError
    public convenience init(accessKey: String, modelURL: URL, enableAutomaticPunctuation: Bool = false) throws {
        try self.init(accessKey: accessKey, modelPath: modelURL.path, enableAutomaticPunctuation: enableAutomaticPunctuation)
    }

    deinit {
        self.delete()
    }

    /// Releases native resources that were allocated to Leopard
    public func delete() {
        if handle != nil {
            pv_leopard_delete(handle)
            handle = nil
        }
    }

    /// Processes a given audio data and returns its transcription.
    ///
    /// - Parameters:
    ///   - pcm: An array of 16-bit pcm samples. The audio needs to have a sample rate equal to `.sample_rate` and be 16-bit
    ///          linearly-encoded. This function operates on single-channel audio. If you wish to process data in a different
    ///          sample rate or format consider using `.process_file`.
    /// - Throws: LeopardError
    /// - Returns: Inferred transcription and sequence of transcribed words with their associated metadata.
    public func process(_ pcm: [Int16]) throws -> (transcript: String, words: [LeopardWord]) {
        if handle == nil {
            throw LeopardInvalidStateError("Leopard must be initialized before processing")
        }

        if pcm.count == 0 {
            throw LeopardInvalidArgumentError("Audio data must not be empty")
        }

        var cTranscript: UnsafeMutablePointer<Int8>?
        var numWords: Int32 = 0
        var cWords: UnsafeMutablePointer<pv_word_t>?
        let status = pv_leopard_process(
                self.handle,
                pcm,
                Int32(pcm.count),
                &cTranscript,
                &numWords,
                &cWords)
        try checkStatus(status, "Leopard process failed")

        let transcript = String(cString: cTranscript!)
        cTranscript?.deallocate()

        var words = [LeopardWord]()
        if numWords > 0 {
            for cWord in UnsafeBufferPointer(start: cWords, count: Int(numWords)) {
                let word = LeopardWord(
                        word: String(cString: cWord.word),
                        startSec: Float(cWord.start_sec),
                        endSec: Float(cWord.end_sec),
                        confidence: Float(cWord.confidence)
                )
                words.append(word)
            }
            cWords?.deallocate()
        }

        return (transcript, words)
    }

    /// Processes a given audio file and returns its transcription.
    ///
    /// - Parameters:
    ///   - audioPath: Absolute path to the audio file. The supported formats are:
    ///                `3gp (AMR)`, `FLAC`, `MP3`, `MP4/m4a (AAC)`, `Ogg`, `WAV` and `WebM`.
    /// - Throws: LeopardError
    /// - Returns: Inferred transcription and sequence of transcribed words with their associated metadata.
    public func processFile(_ audioPath: String) throws -> (transcript: String, words: [LeopardWord]) {
        if handle == nil {
            throw LeopardInvalidStateError("Leopard must be initialized before processing")
        }

        var audioPathArg = audioPath
        if !FileManager().fileExists(atPath: audioPathArg) {
            audioPathArg = try getResourcePath(audioPathArg)
        }

        var cTranscript: UnsafeMutablePointer<Int8>?
        var numWords: Int32 = 0
        var cWords: UnsafeMutablePointer<pv_word_t>?
        let status = pv_leopard_process_file(
                self.handle,
                audioPathArg,
                &cTranscript,
                &numWords,
                &cWords)
        do {
            try checkStatus(status, "Leopard process failed")
        } catch let error as LeopardInvalidArgumentError {
            let fileExtension = (audioPath as NSString).pathExtension.lowercased()
            if !Leopard.supportedAudioTypes.contains(fileExtension) {
                throw LeopardInvalidArgumentError("Audio file with format '\(fileExtension)' is not supported")
            } else {
                throw error
            }
        }

        let transcript = String(cString: cTranscript!)
        cTranscript?.deallocate()

        var words = [LeopardWord]()
        if numWords > 0 {
            for cWord in UnsafeBufferPointer(start: cWords, count: Int(numWords)) {
                let word = LeopardWord(
                        word: String(cString: cWord.word),
                        startSec: Float(cWord.start_sec),
                        endSec: Float(cWord.end_sec),
                        confidence: Float(cWord.confidence)
                )
                words.append(word)
            }
            cWords?.deallocate()
        }

        return (transcript, words)
    }

    /// Processes a given audio file and returns its transcription.
    ///
    /// - Parameters:
    ///   - audioURL: Absolute path to the audio file. The supported formats are:
    ///              `3gp (AMR)`, `FLAC`, `MP3`, `MP4/m4a (AAC)`, `Ogg`, `WAV` and `WebM`.
    /// - Throws: LeopardError
    /// - Returns: Inferred transcription and sequence of transcribed words with their associated metadata.
    public func processFile(_ audioURL: URL) throws -> (transcript: String, words: [LeopardWord]) {
        if handle == nil {
            throw LeopardInvalidStateError("Leopard must be initialized before processing")
        }

        return try self.processFile(audioURL.path)
    }

    /// Given a path, return the full path to the resource.
    ///
    /// - Parameters:
    ///   - filePath: relative path of a file in the bundle.
    /// - Throws: LeopardIOError
    /// - Returns: The full path of the resource.
    private func getResourcePath(_ filePath: String) throws -> String {
        if let resourcePath = Bundle(for: type(of: self)).resourceURL?.appendingPathComponent(filePath).path {
            if (FileManager.default.fileExists(atPath: resourcePath)) {
                return resourcePath
            }
        }

        throw LeopardIOError("Could not find file at path '\(filePath)'. If this is a packaged asset, ensure you have added it to your xcode project.")
    }

    private func checkStatus(_ status: pv_status_t, _ message: String) throws {
        if status == PV_STATUS_SUCCESS {
            return
        }

        switch status {
        case PV_STATUS_OUT_OF_MEMORY:
            throw LeopardMemoryError(message)
        case PV_STATUS_IO_ERROR:
            throw LeopardIOError(message)
        case PV_STATUS_INVALID_ARGUMENT:
            throw LeopardInvalidArgumentError(message)
        case PV_STATUS_STOP_ITERATION:
            throw LeopardStopIterationError(message)
        case PV_STATUS_KEY_ERROR:
            throw LeopardKeyError(message)
        case PV_STATUS_INVALID_STATE:
            throw LeopardInvalidStateError(message)
        case PV_STATUS_RUNTIME_ERROR:
            throw LeopardRuntimeError(message)
        case PV_STATUS_ACTIVATION_ERROR:
            throw LeopardActivationError(message)
        case PV_STATUS_ACTIVATION_LIMIT_REACHED:
            throw LeopardActivationLimitError(message)
        case PV_STATUS_ACTIVATION_THROTTLED:
            throw LeopardActivationThrottledError(message)
        case PV_STATUS_ACTIVATION_REFUSED:
            throw LeopardActivationRefusedError(message)
        default:
            let pvStatusString = String(cString: pv_status_to_string(status))
            throw LeopardError("\(pvStatusString): \(message)")
        }
    }
}
