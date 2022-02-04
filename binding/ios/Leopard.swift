//
//  Copyright 2022 Picovoice Inc.
//  You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
//  file accompanying this source.
//  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
//  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
//  specific language governing permissions and limitations under the License.
//

import PvLeopard

/// iOS binding for Leopard speech-to-text engine. Provides a Swift interface to the Leopard library.
public class Leopard {
    private static let supportedAudioTypes: Set = ["flac", "mp3", "ogg", "opus", "wav", "webm"]

    private var handle: OpaquePointer?
    public static let sampleRate = UInt32(pv_sample_rate())
    public static let version = String(cString: pv_leopard_version())

    /// Constructor.
    ///
    /// - Parameters:
    ///   - accessKey: The AccessKey obtained from Picovoice Console (https://console.picovoice.ai).
    ///   - modelPath: Absolute path to file containing model parameters.
    /// - Throws: LeopardError
    public init(accessKey: String, modelPath: String) throws {

        if accessKey.count == 0 {
            throw LeopardInvalidArgumentError("AccessKey is required for Leopard initialization")
        }

        if !FileManager().fileExists(atPath: modelPath) {
            throw LeopardInvalidArgumentError("Model file at does not exist '\(modelPath)'")
        }

        let status = pv_leopard_init(
                accessKey,
                modelPath,
                &handle)
        try checkStatus(status, "Leopard init failed")
    }

    /// Constructor.
    ///
    /// - Parameters:
    ///   - accessKey: The AccessKey obtained from Picovoice Console (https://console.picovoice.ai).
    ///   - modelURL: URL file containing model parameters.
    /// - Throws: LeopardError
    public convenience init(accessKey: String, modelURL: URL) throws {
        try self.init(accessKey: accessKey, modelPath: modelURL.path)
    }

    deinit {
        self.delete()
    }

    /// Releases native resources that were allocated to Leopard
    public func delete(){
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
    /// - Returns: Inferred transcription.
    public func process(_ pcm:[Int16]) throws -> String {
        if handle == nil {
            throw LeopardInvalidStateError("Leopard must be initialized before processing")
        }

        if pcm.count == 0 {
            throw LeopardInvalidArgumentError("Audio data must not be empty")
        }

        var cTranscript: UnsafeMutablePointer<Int8>?
        let status = pv_leopard_process(self.handle, pcm, Int32(pcm.count), &cTranscript)
        try checkStatus(status, "Leopard process failed")

        let transcript = String(cString: cTranscript!)
        cTranscript?.deallocate()

        return transcript
    }

    /// Processes a given audio file and returns its transcription.
    ///
    /// - Parameters:
    ///   - audioPath: Absolute path to the audio file. The file needs to have a sample rate equal to or greater
    ///                than `Leopard.sampleRate`. The supported formats are: `FLAC`, `MP3`, `Ogg`, `Opus`,
    ///                `Vorbis`, `WAV`, and `WebM`.
    /// - Throws: LeopardError
    /// - Returns: Inferred transcription.
    public func processFile(_ audioPath: String) throws -> String {
        if handle == nil {
            throw LeopardInvalidStateError("Leopard must be initialized before processing")
        }

        if !Leopard.supportedAudioTypes.contains((audioPath as NSString).pathExtension.lowercased()) {
            throw LeopardInvalidArgumentError("File provided is not supported")
        }

        if !FileManager().fileExists(atPath: audioPath) {
            throw LeopardInvalidArgumentError("Could not find the audio file at \(audioPath)")
        }

        var cTranscript: UnsafeMutablePointer<Int8>?
        let status = pv_leopard_process_file(self.handle, audioPath, &cTranscript)
        try checkStatus(status, "Leopard process failed")

        let transcript = String(cString: cTranscript!)
        cTranscript?.deallocate()

        return transcript
    }

    /// Processes a given audio file and returns its transcription.
    ///
    /// - Parameters:
    ///   - audioURL: URL to the audio file. The file needs to have a sample rate equal to or greater
    ///               than `.sample_rate`. The supported formats are: `FLAC`, `MP3`, `Ogg`, `Opus`,
    ///               `Vorbis`, `WAV`, and `WebM`.
    /// - Throws: LeopardError
    /// - Returns: Inferred transcription.
    public func processFile(_ audioURL: URL) throws -> String {
        if handle == nil {
            throw LeopardInvalidStateError("Leopard must be initialized before processing")
        }

        return try self.processFile(audioURL.path)
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
