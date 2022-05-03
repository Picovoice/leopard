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

import Leopard

@objc(PvLeopard)
class PvLeopard: NSObject {
    private var leopardPool:Dictionary<String, Leopard> = [:]

    @objc(create:modelPath:resolver:rejecter:)
    func create(accessKey: String, modelPath: String,
        resolver resolve:RCTPromiseResolveBlock, rejecter reject:RCTPromiseRejectBlock) -> Void {

        do {
            let leopard = try Leopard(
                accessKey: accessKey,
                modelPath: modelPath)

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
    func delete(handle:String) -> Void {
        if let leopard = leopardPool.removeValue(forKey: handle) {
            leopard.delete()
        }
    }

    @objc(process:pcm:resolver:rejecter:)
    func process(handle:String, pcm:[Int16],
        resolver resolve:RCTPromiseResolveBlock, rejecter reject:RCTPromiseRejectBlock) -> Void {
        do {
            if let leopard = leopardPool[handle] {
                let result = try leopard.process(pcm)
                resolve(result)
            } else {
                let (code, message) = errorToCodeAndMessage(LeopardRuntimeError("Invalid handle provided to Leopard 'process'"))
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
    func processFile(handle:String, audioPath:String,
                 resolver resolve:RCTPromiseResolveBlock, rejecter reject:RCTPromiseRejectBlock) -> Void {
        do {
            if let leopard = leopardPool[handle] {
                let result = try leopard.processFile(audioPath)
                resolve(result)
            } else {
                let (code, message) = errorToCodeAndMessage(LeopardRuntimeError("Invalid handle provided to Leopard 'process'"))
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
}
