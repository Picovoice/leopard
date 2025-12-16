//
// Copyright 2022-2025 Picovoice Inc.
//
// You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
// file accompanying this source.
//
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
// an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.
//

import Leopard

@objc(PvLeopard)
class PvLeopard: NSObject {
    private var leopardPool: [String: Leopard] = [:]

    override init() {
        super.init()
        Leopard.setSdk(sdk: "react-native")
    }

    @objc(getAvailableDevices:rejecter:)
    func getAvailableDevices(
        resolver resolve: RCTPromiseResolveBlock,
        rejecter reject: RCTPromiseRejectBlock
    ) {
        do {
            let result: [String] = try Leopard.getAvailableDevices()
            resolve(result)
        } catch let error as LeopardError {
            let (code, message) = errorToCodeAndMessage(error)
            reject(code, message, nil)
        } catch {
            let (code, message) = errorToCodeAndMessage(LeopardError(error.localizedDescription))
            reject(code, message, nil)
        }
    }

    @objc(create:modelPath:device:enableAutomaticPunctuation:enableDiarization:resolver:rejecter:)
    func create(
            accessKey: String,
            modelPath: String,
            device: String,
            enableAutomaticPunctuation: Bool,
            enableDiarization: Bool,
            resolver resolve: RCTPromiseResolveBlock,
            rejecter reject: RCTPromiseRejectBlock) {

        do {
            let leopard = try Leopard(
                    accessKey: accessKey,
                    modelPath: modelPath,
                    device: device.isEmpty ? nil : device,
                    enableAutomaticPunctuation: enableAutomaticPunctuation,
                    enableDiarization: enableDiarization
            )

            let handle: String = String(describing: leopard)
            leopardPool[handle] = leopard

            var param: [String: Any] = [:]
            param["handle"] = handle
            param["sampleRate"] = Leopard.sampleRate
            param["version"] = Leopard.version

            resolve(param)
        } catch let error as LeopardError {
            let (code, message) = errorToCodeAndMessage(error)
            reject(code, message, nil)
        } catch {
            let (code, message) = errorToCodeAndMessage(LeopardError(error.localizedDescription))
            reject(code, message, nil)
        }
    }

    @objc(delete:)
    func delete(handle: String) {
        if let leopard = leopardPool.removeValue(forKey: handle) {
            leopard.delete()
        }
    }

    @objc(process:pcm:resolver:rejecter:)
    func process(
            handle: String,
            pcm: [Int16],
            resolver resolve: RCTPromiseResolveBlock,
            rejecter reject: RCTPromiseRejectBlock) {
        do {
            if let leopard = leopardPool[handle] {
                let result = try leopard.process(pcm)
                let resultMap = leopardTranscriptToDictionary(result: result)
                resolve(resultMap)
            } else {
                let (code, message) = errorToCodeAndMessage(
                        LeopardRuntimeError("Invalid handle provided to Leopard 'process'"))
                reject(code, message, nil)
            }
        } catch let error as LeopardError {
            let (code, message) = errorToCodeAndMessage(error)
            reject(code, message, nil)
        } catch {
            let (code, message) = errorToCodeAndMessage(LeopardError(error.localizedDescription))
            reject(code, message, nil)
        }
    }

    @objc(processFile:audioPath:resolver:rejecter:)
    func processFile(
            handle: String,
            audioPath: String,
            resolver resolve: RCTPromiseResolveBlock,
            rejecter reject: RCTPromiseRejectBlock) {
        do {
            if let leopard = leopardPool[handle] {
                let result = try leopard.processFile(audioPath)
                let resultMap = leopardTranscriptToDictionary(result: result)
                resolve(resultMap)
            } else {
                let (code, message) = errorToCodeAndMessage(
                        LeopardRuntimeError("Invalid handle provided to Leopard 'process'"))
                reject(code, message, nil)
            }
        } catch let error as LeopardError {
            let (code, message) = errorToCodeAndMessage(error)
            reject(code, message, nil)
        } catch {
            let (code, message) = errorToCodeAndMessage(LeopardError(error.localizedDescription))
            reject(code, message, nil)
        }
    }

    private func errorToCodeAndMessage(_ error: LeopardError) -> (String, String) {
        return (error.name.replacingOccurrences(of: "Error", with: "Exception"), error.localizedDescription)
    }

    private func leopardTranscriptToDictionary(result: (transcript: String, words: [LeopardWord])) -> [String: Any] {
        var resultMap: [String: Any] = [:]
        resultMap["transcript"] = result.transcript

        var wordMapArray: [[String: Any]] = []
        for wordMeta in result.words {
            var wordMap: [String: Any] = [:]
            wordMap["word"] = wordMeta.word
            wordMap["confidence"] = wordMeta.confidence
            wordMap["startSec"] = wordMeta.startSec
            wordMap["endSec"] = wordMeta.endSec
            wordMap["speakerTag"] = wordMeta.speakerTag
            wordMapArray.append(wordMap)
        }
        resultMap["words"] = wordMapArray

        return resultMap
    }
}
