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
    let transcript: String = "MR QUILTER IS THE APOSTLE OF THE MIDDLE CLASSES AND WE ARE GLAD TO WELCOME HIS GOSPEL"

    var leopard: Leopard?

    override func setUp() {
        super.setUp()
        let modelURL = Bundle(for: type(of: self)).url(forResource: "leopard_params", withExtension: "pv")!
        leopard = try? Leopard(accessKey: accessKey, modelURL: modelURL)
    }

    override func tearDown() {
        super.tearDown()
        leopard?.delete()
    }

    override func setUpWithError() throws {
        continueAfterFailure = true
    }

    func testProcess() throws {
        let bundle = Bundle(for: type(of: self))
        let fileURL: URL = bundle.url(forResource: "test", withExtension: "wav")!
        let data = try Data(contentsOf: fileURL)
        var pcmBuffer = Array<Int16>(repeating: 0, count: (data.count / MemoryLayout<Int16>.size))
        _ = pcmBuffer.withUnsafeMutableBytes {
            data.copyBytes(to: $0, from: 0..<data.count)
        }

        let res = try leopard?.process(pcmBuffer)
        XCTAssertEqual(transcript, res)
    }

    func testProcessFile() throws {
        let bundle = Bundle(for: type(of: self))
        let filePath: String = bundle.path(forResource: "test", ofType: "wav")!

        let res = try leopard?.processFile(filePath)
        XCTAssertEqual(transcript, res)
    }

    func testProcessURL() throws {
        let bundle = Bundle(for: type(of: self))
        let fileURL: URL = bundle.url(forResource: "test", withExtension: "wav")!

        let res = try leopard?.processFile(fileURL)
        XCTAssertEqual(transcript, res)
    }

    func testVersion() throws {
        XCTAssertTrue(Leopard.version is String)
        XCTAssertGreaterThan(Leopard.version, "")
    }
}
