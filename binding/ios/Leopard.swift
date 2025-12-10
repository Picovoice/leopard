//
//  Copyright 2022-2025 Picovoice Inc.
//  You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
//  file accompanying this source.
//  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
//  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
//  specific language governing permissions and limitations under the License.
//

import Foundation

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

    /// The speaker tag is `-1` if diarization is not enabled during initialization;
    /// otherwise, it's a non-negative integer identifying unique speakers, with `0` reserved for
    /// unknown speakers.
    public let speakerTag: Int

    /// Constructor.
    ///
    /// - Parameters:
    ///   - word: Transcribed word.
    ///   - startSec: Start of word in seconds.
    ///   - endSec: End of word in seconds.
    ///   - confidence: Transcription confidence. It is a number within [0, 1].
    ///   - speakerTag: The speaker tag is `-1` if diarization is not enabled during initialization;
    ///     otherwise, it's a non-negative integer identifying unique speakers, with `0` reserved for
    ///     unknown speakers.
    public init(
        word: String,
        startSec: Float,
        endSec: Float,
        confidence: Float,
        speakerTag: Int) {
        self.word = word
        self.startSec = startSec
        self.endSec = endSec
        self.confidence = confidence
        self.speakerTag = speakerTag
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
        "webm"
    ]

    private var handle: OpaquePointer?

    public static let sampleRate = UInt32(pv_sample_rate())
    public static let version = String(cString: pv_leopard_version())
    private static var sdk = "ios"

    public static func setSdk(sdk: String) {
        self.sdk = sdk
    }

    /// Lists all available devices that Leopard can use for inference.
    /// Entries in the list can be used as the `device` argument when initializing Leopard.
    ///
    /// - Throws: LeopardError
    /// - Returns: Array of available devices that Leopard can be used for inference.
    public static func getAvailableDevices() throws -> [String] {
        var cHardwareDevices: UnsafeMutablePointer<UnsafeMutablePointer<Int8>?>?
        var numHardwareDevices: Int32 = 0
        let status = pv_leopard_list_hardware_devices(&cHardwareDevices, &numHardwareDevices)
        if status != PV_STATUS_SUCCESS {
            let messageStack = try Leopard.getMessageStack()
            throw Leopard.pvStatusToLeopardError(status, "Leopard getAvailableDevices failed", messageStack)
        }

        var hardwareDevices: [String] = []
        for i in 0..<numHardwareDevices {
            hardwareDevices.append(String(cString: cHardwareDevices!.advanced(by: Int(i)).pointee!))
        }

        pv_leopard_free_hardware_devices(cHardwareDevices, numHardwareDevices)

        return hardwareDevices
    }

    /// Constructor.
    ///
    /// - Parameters:
    ///   - accessKey: The AccessKey obtained from Picovoice Console (https://console.picovoice.ai).
    ///   - modelPath: Absolute path to file containing model parameters.
    ///   - device: String representation of the device (e.g., CPU or GPU) to use. If set to `best`, the most
    ///     suitable device is selected automatically. If set to `gpu`, the engine uses the first available GPU
    ///     device. To select a specific GPU device, set this argument to `gpu:${GPU_INDEX}`, where `${GPU_INDEX}`
    ///     is the index of the target GPU. If set to `cpu`, the engine will run on the CPU with the default
    ///     number of threads. To specify the number of threads, set this argument to `cpu:${NUM_THREADS}`,
    ///     where `${NUM_THREADS}` is the desired number of threads.
    ///   - enableAutomaticPunctuation: Set to `true` to enable automatic punctuation insertion.
    ///   - enableDiarization: Set to `true` to enable speaker diarization, which allows Leopard to
    ///     differentiate speakers as part of the transcription process. Word metadata will include
    ///     a `speakerTag` to identify unique speakers.
    /// - Throws: LeopardError
    public init(
        accessKey: String,
        modelPath: String,
        device: String? = nil,
        enableAutomaticPunctuation: Bool = false,
        enableDiarization: Bool = false) throws {

        if accessKey.count == 0 {
            throw LeopardInvalidArgumentError("AccessKey is required for Leopard initialization")
        }

        var modelPathArg = modelPath
        if !FileManager().fileExists(atPath: modelPathArg) {
            modelPathArg = try getResourcePath(modelPathArg)
        }

        var deviceArg = device
        if device == nil {
            deviceArg = "best"
        }

        let status = pv_leopard_init(
                accessKey,
                modelPathArg,
                device,
                enableAutomaticPunctuation,
                enableDiarization,
                &handle)

        pv_set_sdk(Leopard.sdk)

        if status != PV_STATUS_SUCCESS {
            let messageStack = try Leopard.getMessageStack()
            throw Leopard.pvStatusToLeopardError(status, "Leopard init failed", messageStack)
        }
    }

    /// Constructor.
    ///
    /// - Parameters:
    ///   - accessKey: The AccessKey obtained from Picovoice Console (https://console.picovoice.ai).
    ///   - modelURL: URL to the file containing model parameters.
    ///   - device: String representation of the device (e.g., CPU or GPU) to use. If set to `best`, the most
    ///     suitable device is selected automatically. If set to `gpu`, the engine uses the first available GPU
    ///     device. To select a specific GPU device, set this argument to `gpu:${GPU_INDEX}`, where `${GPU_INDEX}`
    ///     is the index of the target GPU. If set to `cpu`, the engine will run on the CPU with the default
    ///     number of threads. To specify the number of threads, set this argument to `cpu:${NUM_THREADS}`,
    ///     where `${NUM_THREADS}` is the desired number of threads.
    ///   - enableAutomaticPunctuation: Set to `true` to enable automatic punctuation insertion.
    ///   - enableDiarization: Set to `true` to enable speaker diarization, which allows Leopard to
    ///     differentiate speakers as part of the transcription process. Word metadata will include
    ///     a `speakerTag` to identify unique speakers.
    /// - Throws: LeopardError
    public convenience init(
        accessKey: String,
        modelURL: URL,
        device: String? = nil,
        enableAutomaticPunctuation: Bool = false,
        enableDiarization: Bool = false) throws {
        try self.init(
                accessKey: accessKey,
                modelPath: modelURL.path,
                device: device,
                enableAutomaticPunctuation: enableAutomaticPunctuation,
                enableDiarization: enableDiarization)
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
    ///   - pcm: An array of 16-bit pcm samples. The audio needs to have a sample rate equal to `.sample_rate`
    ///          and be 16-bit linearly-encoded. This function operates on single-channel audio.
    ///          If you wish to process data in a different sample rate or format consider using `.process_file`.
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
        if status != PV_STATUS_SUCCESS {
            let messageStack = try Leopard.getMessageStack()
            throw Leopard.pvStatusToLeopardError(status, "Leopard process failed", messageStack)
        }

        let transcript = String(cString: cTranscript!)
        pv_leopard_transcript_delete(cTranscript)

        var words = [LeopardWord]()
        if numWords > 0 {
            for cWord in UnsafeBufferPointer(start: cWords, count: Int(numWords)) {
                let word = LeopardWord(
                        word: String(cString: cWord.word),
                        startSec: Float(cWord.start_sec),
                        endSec: Float(cWord.end_sec),
                        confidence: Float(cWord.confidence),
                        speakerTag: Int(cWord.speaker_tag)
                )
                words.append(word)
            }
            pv_leopard_words_delete(cWords)
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
        if status != PV_STATUS_SUCCESS {
            let messageStack = try Leopard.getMessageStack()
            throw Leopard.pvStatusToLeopardError(status, "Leopard process file failed", messageStack)
        }

        let transcript = String(cString: cTranscript!)
        pv_leopard_transcript_delete(cTranscript)

        var words = [LeopardWord]()
        if numWords > 0 {
            for cWord in UnsafeBufferPointer(start: cWords, count: Int(numWords)) {
                let word = LeopardWord(
                        word: String(cString: cWord.word),
                        startSec: Float(cWord.start_sec),
                        endSec: Float(cWord.end_sec),
                        confidence: Float(cWord.confidence),
                        speakerTag: Int(cWord.speaker_tag)
                )
                words.append(word)
            }
            pv_leopard_words_delete(cWords)
        }

        return (transcript, words)
    }

    /// Processes a given audio file and returns its transcription.
    ///
    /// - Parameters:
    ///   - audioURL: URL to the audio file. The supported formats are:
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
            if FileManager.default.fileExists(atPath: resourcePath) {
                return resourcePath
            }
        }

        throw LeopardIOError("Could not find file at path '\(filePath)'. " +
                "If this is a packaged asset, ensure you have added it to your xcode project.")
    }

    private static func pvStatusToLeopardError(
        _ status: pv_status_t,
        _ message: String,
        _ messageStack: [String] = []) -> LeopardError {
        switch status {
        case PV_STATUS_OUT_OF_MEMORY:
            return LeopardMemoryError(message, messageStack)
        case PV_STATUS_IO_ERROR:
            return LeopardIOError(message, messageStack)
        case PV_STATUS_INVALID_ARGUMENT:
            return LeopardInvalidArgumentError(message, messageStack)
        case PV_STATUS_STOP_ITERATION:
            return LeopardStopIterationError(message, messageStack)
        case PV_STATUS_KEY_ERROR:
            return LeopardKeyError(message, messageStack)
        case PV_STATUS_INVALID_STATE:
            return LeopardInvalidStateError(message, messageStack)
        case PV_STATUS_RUNTIME_ERROR:
            return LeopardRuntimeError(message, messageStack)
        case PV_STATUS_ACTIVATION_ERROR:
            return LeopardActivationError(message, messageStack)
        case PV_STATUS_ACTIVATION_LIMIT_REACHED:
            return LeopardActivationLimitError(message, messageStack)
        case PV_STATUS_ACTIVATION_THROTTLED:
            return LeopardActivationThrottledError(message, messageStack)
        case PV_STATUS_ACTIVATION_REFUSED:
            return LeopardActivationRefusedError(message, messageStack)
        default:
            let pvStatusString = String(cString: pv_status_to_string(status))
            return LeopardError("\(pvStatusString): \(message)", messageStack)
        }
    }

    private static func getMessageStack() throws -> [String] {
        var messageStackRef: UnsafeMutablePointer<UnsafeMutablePointer<Int8>?>?
        var messageStackDepth: Int32 = 0
        let status = pv_get_error_stack(&messageStackRef, &messageStackDepth)
        if status != PV_STATUS_SUCCESS {
            throw pvStatusToLeopardError(status, "Unable to get Leopard error state")
        }

        var messageStack: [String] = []
        for i in 0..<messageStackDepth {
            messageStack.append(String(cString: messageStackRef!.advanced(by: Int(i)).pointee!))
        }

        pv_free_error_stack(messageStackRef)

        return messageStack
    }
}
