//
//  Copyright 2022 Picovoice Inc.
//  You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
//  file accompanying this source.
//  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
//  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
//  specific language governing permissions and limitations under the License.
//

import AVFoundation
import XCTest
import Leopard

class LeopardAppTestUITests: XCTestCase {
    let accessKey: String = "{TESTING_ACCESS_KEY_HERE}"
    let initThresholdString: String = "{INIT_PERFORMANCE_THRESHOLD_SEC}"
    let procThresholdString: String = "{PROC_PERFORMANCE_THRESHOLD_SEC}"
    let transcript: String = "MR QUILTER IS THE APOSTLE OF THE MIDDLE CLASSES AND WE ARE GLAD TO WELCOME HIS GOSPEL"

    override func setUpWithError() throws {
        continueAfterFailure = true
    }

    func testProcess() throws {
        let bundle = Bundle(for: type(of: self))

        let modelURL = bundle.url(forResource: "leopard_params", withExtension: "pv")!
        let leopard = try? Leopard(accessKey: accessKey, modelURL: modelURL)
        
        let fileURL: URL = bundle.url(forResource: "test", withExtension: "wav")!
        let data = try Data(contentsOf: fileURL)
        var pcmBuffer = Array<Int16>(repeating: 0, count: (data.count / MemoryLayout<Int16>.size))
        _ = pcmBuffer.withUnsafeMutableBytes {
            data.copyBytes(to: $0, from: 0..<data.count)
        }

        let res = try leopard?.process(pcmBuffer)
        leopard?.delete()

        XCTAssertEqual(transcript, res)
    }

    func testProcessFile() throws {
        let bundle = Bundle(for: type(of: self))

        let modelURL = bundle.url(forResource: "leopard_params", withExtension: "pv")!
        let leopard = try? Leopard(accessKey: accessKey, modelURL: modelURL)

        let filePath: String = bundle.path(forResource: "test", ofType: "wav")!
        
        let res = try leopard?.processFile(filePath)
        leopard?.delete()

        XCTAssertEqual(transcript, res)
    }

    func testProcessURL() throws {
        let bundle = Bundle(for: type(of: self))

        let modelURL = bundle.url(forResource: "leopard_params", withExtension: "pv")!
        let leopard = try? Leopard(accessKey: accessKey, modelURL: modelURL)

        let fileURL: URL = bundle.url(forResource: "test", withExtension: "wav")!

        let res = try leopard?.processFile(fileURL)
        leopard?.delete()

        XCTAssertEqual(transcript, res)
    }

    func testVersion() throws {
        XCTAssertTrue(Leopard.version is String)
        XCTAssertGreaterThan(Leopard.version, "")
    }

    func testPerformance() throws {
        try XCTSkipIf(initThresholdString == "{INIT_PERFORMANCE_THRESHOLD_SEC}")
        try XCTSkipIf(procThresholdString == "{PROC_PERFORMANCE_THRESHOLD_SEC}")

        let initPerformanceThresholdSec = Double(initThresholdString)
        try XCTSkipIf(initPerformanceThresholdSec == nil)
        let procPerformanceThresholdSec = Double(procThresholdString)
        try XCTSkipIf(procPerformanceThresholdSec == nil)

        let bundle = Bundle(for: type(of: self))
        let modelURL = bundle.url(forResource: "leopard_params", withExtension: "pv")!
        let beforeInit = CFAbsoluteTimeGetCurrent()
        let leopard = try? Leopard(accessKey: accessKey, modelURL: modelURL)
        let afterInit = CFAbsoluteTimeGetCurrent()

        let filePath: String = bundle.path(forResource: "test", ofType: "wav")!

        let beforeProc = CFAbsoluteTimeGetCurrent()
        let res = try leopard?.processFile(filePath)
        let afterProc = CFAbsoluteTimeGetCurrent()

        let totalSecInit = Double(round((afterInit - beforeInit) * 1000) / 1000)
        let totalSecProc = Double(round((afterProc - beforeProc) * 1000) / 1000)
        XCTAssertLessThanOrEqual(totalSecInit, initPerformanceThresholdSec!)
        XCTAssertLessThanOrEqual(totalSecProc, procPerformanceThresholdSec!)
    }    
}
