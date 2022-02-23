//
// Copyright 2022 Picovoice Inc.
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

enum Method : String {
    case CREATE
    case PROCESS
    case PROCESSFILE
    case DELETE
}

public class SwiftLeopardPlugin: NSObject, FlutterPlugin {
    private var leopardPool:Dictionary<String, Leopard> = [:]
    
    public static func register(with registrar: FlutterPluginRegistrar) {
        let instance = SwiftLeopardPlugin()

        let methodChannel = FlutterMethodChannel(name: "leopard", binaryMessenger: registrar.messenger())
        registrar.addMethodCallDelegate(instance, channel: methodChannel)
    }
    
    public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        guard let method = Method(rawValue: call.method.uppercased()) else {
            result(errorToFlutterError(LeopardRuntimeError("Leopard method '\(call.method)' is not a valid function")))
            return
        }
        let args = call.arguments as! [String: Any]
        
        switch (method) {
        case .CREATE:
            do {
                if let accessKey = args["accessKey"] as? String,
                   let modelPath = args["modelPath"] as? String {

                    let leopard = try Leopard(
                        accessKey: accessKey,
                        modelPath: modelPath,
                    )
                    
                    let handle: String = String(describing: leopard)
                    leopardPool[handle] = leopard
                    
                    var param: [String: Any] = [:]
                    param["handle"] = handle
                    param["sampleRate"] = Leopard.sampleRate
                    param["version"] = Leopard.version
                    
                    result(param)
                } else {
                    result(errorToFlutterError(LeopardInvalidArgumentError("missing required arguments 'accessKey' and 'modelPath'")))
                }
            } catch let error as LeopardError {
                result(errorToFlutterError(error))
            } catch {
                result(errorToFlutterError(LeopardError(error.localizedDescription)))
            }
            break
        case .PROCESS:
            do {
                if let handle = args["handle"] as? String,
                   let frame = args["frame"] as? [Int16] {
                    if let leopard = leopardPool[handle] {
                        var param: [String: Any] = [:]
                        
                        let transcript = try leopard.process(frame)
                        param["transcript"] = transcript
                        
                        result(param)
                    } else {
                        result(errorToFlutterError(LeopardInvalidStateError("Invalid handle provided to Leopard 'process'")))
                    }
                } else {
                    result(errorToFlutterError(LeopardInvalidArgumentError("missing required arguments 'handle' and 'frame'")))
                }
            } catch let error as LeopardError {
                result(errorToFlutterError(error))
            } catch {
                result(errorToFlutterError(LeopardError(error.localizedDescription)))
            }
            break
        case .PROCESSFILE:
            do {
                if let handle = args["handle"] as? String,
                   let path = args["path"] as? String {
                    if let leopard = leopardPool[handle] {
                        var param: [String: Any] = [:]

                        let transcript = try leopard.processFile(path)
                        param["transcript"] = transcript

                        result(param)
                    } else {
                        result(errorToFlutterError(LeopardInvalidStateError("Invalid handle provided to Leopard 'process'")))
                    }
                } else {
                    result(errorToFlutterError(LeopardInvalidArgumentError("missing required arguments 'handle'")))
                }
            } catch let error as LeopardError {
                result(errorToFlutterError(error))
            } catch {
                result(errorToFlutterError(LeopardError(error.localizedDescription)))
            }
            break
        case .DELETE:
            if let handle = args["handle"] as? String {
                if let leopard = leopardPool.removeValue(forKey: handle) {
                    leopard.delete()
                }
            }
            break
        }
    }
    
    private func errorToFlutterError(_ error: LeopardError) -> FlutterError {
        return FlutterError(code: error.name.replacingOccurrences(of: "Error", with: "Exception"), message: error.localizedDescription, details: nil)
    }
}
