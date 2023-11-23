//
// Copyright 2022-2023 Picovoice Inc.
//
// You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
// file accompanying this source.
//
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
// an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.
//

import Flutter
import UIKit
import Leopard

enum Method: String {
    case CREATE
    case PROCESS
    case PROCESSFILE
    case DELETE
}

public class SwiftLeopardPlugin: NSObject, FlutterPlugin {
    private var leopardPool: [String: Leopard] = [:]

    public static func register(with registrar: FlutterPluginRegistrar) {
        let instance = SwiftLeopardPlugin()

        let methodChannel = FlutterMethodChannel(name: "leopard", binaryMessenger: registrar.messenger())
        registrar.addMethodCallDelegate(instance, channel: methodChannel)

        Leopard.setSdk(sdk: "flutter")
    }

    public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        guard let method = Method(rawValue: call.method.uppercased()) else {
            result(errorToFlutterError(
                LeopardRuntimeError("Leopard method '\(call.method)' is not a valid function")))
            return
        }
        let args = call.arguments as! [String: Any]

        switch method {
        case .CREATE:
            do {
                if let accessKey = args["accessKey"] as? String,
                   let modelPath = args["modelPath"] as? String {
                    let enableAutomaticPunctuation = args["enableAutomaticPunctuation"] as? Bool
                    let enableDiarization = args["enableDiarization"] as? Bool

                    let leopard = try Leopard(
                            accessKey: accessKey,
                            modelPath: modelPath,
                            enableAutomaticPunctuation: enableAutomaticPunctuation ?? false,
                            enableDiarization: enableDiarization ?? false
                    )

                    let handle: String = String(describing: leopard)
                    leopardPool[handle] = leopard

                    let param: [String: Any] = [
                        "handle": handle,
                        "sampleRate": Leopard.sampleRate,
                        "version": Leopard.version
                    ]
                    result(param)
                } else {
                    result(errorToFlutterError(
                        LeopardInvalidArgumentError("missing required arguments 'accessKey' and 'modelPath'")))
                }
            } catch let error as LeopardError {
                result(errorToFlutterError(error))
            } catch {
                result(errorToFlutterError(LeopardError(error.localizedDescription)))
            }
        case .PROCESS:
            do {
                if let handle = args["handle"] as? String,
                   let frame = args["frame"] as? [Int16] {
                    if let leopard = leopardPool[handle] {
                        let leopardTranscript = try leopard.process(frame)
                        let resultDictionary = leopardTranscriptToDictionary(leopardTranscript)
                        result(resultDictionary)
                    } else {
                        result(errorToFlutterError(
                            LeopardInvalidStateError("Invalid handle provided to Leopard 'process'")))
                    }
                } else {
                    result(errorToFlutterError(
                        LeopardInvalidArgumentError("missing required arguments 'handle' and 'frame'")))
                }
            } catch let error as LeopardError {
                result(errorToFlutterError(error))
            } catch {
                result(errorToFlutterError(LeopardError(error.localizedDescription)))
            }
        case .PROCESSFILE:
            do {
                if let handle = args["handle"] as? String,
                   let path = args["path"] as? String {
                    if let leopard = leopardPool[handle] {
                        let leopardTranscript = try leopard.processFile(path)
                        let resultDictionary = leopardTranscriptToDictionary(leopardTranscript)
                        result(resultDictionary)
                    } else {
                        result(errorToFlutterError(
                            LeopardInvalidStateError("Invalid handle provided to Leopard 'process'")))
                    }
                } else {
                    result(errorToFlutterError(LeopardInvalidArgumentError("missing required arguments 'handle'")))
                }
            } catch let error as LeopardError {
                result(errorToFlutterError(error))
            } catch {
                result(errorToFlutterError(LeopardError(error.localizedDescription)))
            }
        case .DELETE:
            if let handle = args["handle"] as? String {
                if let leopard = leopardPool.removeValue(forKey: handle) {
                    leopard.delete()
                }
            }
        }
    }

    private func errorToFlutterError(_ error: LeopardError) -> FlutterError {
        return FlutterError(
            code: error.name.replacingOccurrences(of: "Error", with: "Exception"),
            message: error.localizedDescription,
            details: nil)
    }

    private func leopardTranscriptToDictionary(_ result: (transcript: String, words: [LeopardWord])) -> [String: Any] {
        var resultDictionary: [String: Any] = [:]
        resultDictionary["transcript"] = result.transcript

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
        resultDictionary["words"] = wordMapArray

        return resultDictionary
    }
}
