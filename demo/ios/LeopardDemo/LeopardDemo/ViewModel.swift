//
//  Copyright 2022 Picovoice Inc.
//  You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
//  file accompanying this source.
//  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
//  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
//  specific language governing permissions and limitations under the License.
//

import AVFoundation
import Foundation
import Leopard

enum UIState {
    case INIT
    case READY
    case RECORDING
    case PROCESSING
    case TRANSCRIBED
    case ERROR
}

class ViewModel: ObservableObject {
    private let ACCESS_KEY = "${YOUR_ACCESS_KEY_HERE}" // Obtained from Picovoice Console (https://console.picovoice.ai)

    private var leopard: Leopard!

    private var recordingTimer = Timer()
    private var audioRecorder: AVAudioRecorder!
    private var isListening = false
    private let MAX_RECORDING_LENGTH_SEC = 120.0

    @Published var errorMessage = ""
    @Published var state = UIState.INIT
    @Published var transcript: String = ""
    @Published var words:[LeopardWord] = []
    @Published var recordingTimeSec = 0.0
    @Published var transcribeTimeSec = 0.0

    init() {
        initialize()
    }

    public func initialize() {
        state = UIState.INIT
        do {
            let modelPath = Bundle(for: type(of: self)).path(forResource: "leopard_params", ofType: "pv")!
            try leopard = Leopard(
                    accessKey: ACCESS_KEY,
                    modelPath: modelPath,
                    enableAutomaticPunctuation: true)
            state = UIState.READY
        } catch let error as LeopardInvalidArgumentError{
            errorMessage = "\(error.localizedDescription)\nEnsure your AccessKey '\(ACCESS_KEY)' is valid."
        } catch is LeopardActivationError {
            errorMessage = "ACCESS_KEY activation error"
        } catch is LeopardActivationRefusedError {
            errorMessage = "ACCESS_KEY activation refused"
        } catch is LeopardActivationLimitError {
            errorMessage = "ACCESS_KEY reached its limit"
        } catch is LeopardActivationThrottledError  {
            errorMessage = "ACCESS_KEY is throttled"
        } catch {
            errorMessage = "\(error)"
        }
    }

    public func destroy() {
        if isListening {
            try? stop()
            recordingTimer.invalidate()
        }
        leopard.delete()
    }

    public func toggleRecording() {
        if isListening {
            toggleRecordingOff()
        } else {
            toggleRecordingOn()
        }
    }

    public func toggleRecordingOff() {
        recordingTimer.invalidate()
        state = UIState.PROCESSING

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.01) {
            do {
                try self.stop()
                self.state = UIState.TRANSCRIBED
            } catch {
                self.errorMessage = "\(error.localizedDescription)"
                self.state = UIState.ERROR
            }
        }
    }

    public func toggleRecordingOn() {
        recordingTimeSec = 0
        recordingTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { timer in
            self.recordingTimeSec += 0.1
            if(self.recordingTimeSec >= self.MAX_RECORDING_LENGTH_SEC) {
                self.toggleRecordingOff()
            }
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.01) {
            do {
                try self.start()
                self.state = UIState.RECORDING
            } catch {
                self.errorMessage = "\(error.localizedDescription)"
                self.state = UIState.ERROR
            }
        }
    }

    public func start() throws {
        guard !isListening else {
            return
        }

        let audioSession = AVAudioSession.sharedInstance()
        if audioSession.recordPermission == .denied {
            errorMessage = "Recording permission is required for this demo"
            state = UIState.ERROR
            return
        }

        try audioSession.setActive(true)
        try audioSession.setCategory(AVAudioSession.Category.playAndRecord,
                options: [.mixWithOthers, .defaultToSpeaker, .allowBluetooth])

        let documentPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let audioFilename = documentPath.appendingPathComponent("LeopardDemo.wav")

        var formatDescription = AudioStreamBasicDescription(
                mSampleRate: Float64(Leopard.sampleRate),
                mFormatID: kAudioFormatLinearPCM,
                mFormatFlags: kLinearPCMFormatFlagIsSignedInteger | kLinearPCMFormatFlagIsPacked,
                mBytesPerPacket: 2,
                mFramesPerPacket: 1,
                mBytesPerFrame: 2,
                mChannelsPerFrame: 1,
                mBitsPerChannel: 16,
                mReserved: 0)
        let format = AVAudioFormat(streamDescription: &formatDescription)!

        audioRecorder = try AVAudioRecorder(url: audioFilename, format: format)
        audioRecorder.record()
        isListening = true
    }

    public func stop() throws {
        guard isListening else {
            return
        }

        audioRecorder.stop()
        isListening = false

        let fileManager = FileManager.default
        let documentDirectory = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let directoryContents = try fileManager.contentsOfDirectory(at: documentDirectory, includingPropertiesForKeys: nil)

        let path = directoryContents[0].path

        let begin = clock()
        let result = try leopard.processFile(path)
        transcript = result.transcript
        words = result.words
        transcribeTimeSec = Double(clock() - begin) / Double(CLOCKS_PER_SEC)
    }

}
