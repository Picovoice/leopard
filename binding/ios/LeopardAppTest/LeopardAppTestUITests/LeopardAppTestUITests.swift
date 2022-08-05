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
    let transcript: String = "Mr quilter is the apostle of the middle classes and we are glad to welcome his gospel"
    let transcriptWithPunctuation: String = "Mr. Quilter is the apostle of the middle classes and we are glad to welcome his gospel.";

    let expectedWords = [
        LeopardWord(word: "Mr", startSec: 0.58, endSec: 0.80, confidence: 0.95),
        LeopardWord(word: "quilter", startSec: 0.86, endSec: 1.18, confidence: 0.80),
        LeopardWord(word: "is", startSec: 1.31, endSec: 1.38, confidence: 0.96),
        LeopardWord(word: "the", startSec: 1.44, endSec: 1.50, confidence: 0.90),
        LeopardWord(word: "apostle", startSec: 1.57, endSec: 2.08, confidence: 0.79),
        LeopardWord(word: "of", startSec: 2.18, endSec: 2.24, confidence: 0.98),
        LeopardWord(word: "the", startSec: 2.30, endSec: 2.34, confidence: 0.98),
        LeopardWord(word: "middle", startSec: 2.40, endSec: 2.59, confidence: 0.97),
        LeopardWord(word: "classes", startSec: 2.69, endSec: 3.17, confidence: 0.98),
        LeopardWord(word: "and", startSec: 3.36, endSec: 3.46, confidence: 0.95),
        LeopardWord(word: "we", startSec: 3.52, endSec: 3.55, confidence: 0.96),
        LeopardWord(word: "are", startSec: 3.65, endSec: 3.65, confidence: 0.97),
        LeopardWord(word: "glad", startSec: 3.74, endSec: 4.03, confidence: 0.93),
        LeopardWord(word: "to", startSec: 4.10, endSec: 4.16, confidence: 0.97),
        LeopardWord(word: "welcome", startSec: 4.22, endSec: 4.58, confidence: 0.89),
        LeopardWord(word: "his", startSec: 4.67, endSec: 4.83, confidence: 0.96),
        LeopardWord(word: "gospel", startSec: 4.93, endSec: 5.38, confidence: 0.93),
    ]

    let modelURL = Bundle(for: LeopardAppTestUITests.self).url(forResource: "leopard_params", withExtension: "pv")!

    override func setUp() {
        super.setUp()
    }

    override func tearDown() {
        super.tearDown()

    }

    override func setUpWithError() throws {
        continueAfterFailure = true
    }

    func testProcess() throws {
        let leopard = try? Leopard(
                accessKey: accessKey,
                modelURL: modelURL)

        let bundle = Bundle(for: type(of: self))
        let fileURL: URL = bundle.url(forResource: "test", withExtension: "wav")!
        let data = try Data(contentsOf: fileURL)
        var pcmBuffer = Array<Int16>(repeating: 0, count: (data.count / MemoryLayout<Int16>.size))
        _ = pcmBuffer.withUnsafeMutableBytes {
            data.copyBytes(to: $0, from: 0..<data.count)
        }

        let result = try leopard!.process(pcmBuffer)
        leopard!.delete()
        XCTAssertEqual(transcript, result.transcript)

        XCTAssertEqual(expectedWords.count, result.words.count)
        for i in 0..<result.words.count {
            XCTAssertEqual(result.words[i].word, expectedWords[i].word)
            XCTAssertEqual(result.words[i].startSec, expectedWords[i].startSec, accuracy: 0.1)
            XCTAssertEqual(result.words[i].endSec, expectedWords[i].endSec, accuracy: 0.1)
            XCTAssertEqual(result.words[i].confidence, expectedWords[i].confidence, accuracy: 0.1)
        }
    }

    func testProcessFile() throws {
        let leopard = try? Leopard(
                accessKey: accessKey,
                modelURL: modelURL)

        let bundle = Bundle(for: type(of: self))
        let filePath: String = bundle.path(forResource: "test", ofType: "wav")!

        let result = try leopard!.processFile(filePath)
        leopard!.delete()
        XCTAssertEqual(transcript, result.transcript)

        XCTAssertEqual(expectedWords.count, result.words.count)
        for i in 0..<result.words.count {
            XCTAssertEqual(result.words[i].word, expectedWords[i].word)
            XCTAssertEqual(result.words[i].startSec, expectedWords[i].startSec, accuracy: 0.1)
            XCTAssertEqual(result.words[i].endSec, expectedWords[i].endSec, accuracy: 0.1)
            XCTAssertEqual(result.words[i].confidence, expectedWords[i].confidence, accuracy: 0.1)
        }
    }

    func testProcessURL() throws {
        let leopard = try? Leopard(
                accessKey: accessKey,
                modelURL: modelURL)

        let bundle = Bundle(for: type(of: self))
        let fileURL: URL = bundle.url(forResource: "test", withExtension: "wav")!

        let result = try leopard!.processFile(fileURL)
        leopard!.delete()
        XCTAssertEqual(transcript, result.transcript)

        XCTAssertEqual(expectedWords.count, result.words.count)
        for i in 0..<result.words.count {
            XCTAssertEqual(result.words[i].word, expectedWords[i].word)
            XCTAssertEqual(result.words[i].startSec, expectedWords[i].startSec, accuracy: 0.1)
            XCTAssertEqual(result.words[i].endSec, expectedWords[i].endSec, accuracy: 0.1)
            XCTAssertEqual(result.words[i].confidence, expectedWords[i].confidence, accuracy: 0.1)
        }
    }

    func testProcessWithPunctuation() throws {
        let leopard = try? Leopard(
                accessKey: accessKey,
                modelURL: modelURL,
                enableAutomaticPunctuation: true)

        let bundle = Bundle(for: type(of: self))
        let filePath: String = bundle.path(forResource: "test", ofType: "wav")!

        let result = try leopard!.processFile(filePath)
        leopard!.delete()
        XCTAssertEqual(transcriptWithPunctuation, result.transcript)

        XCTAssertEqual(expectedWords.count, result.words.count)
        for i in 0..<result.words.count {
            XCTAssertEqual(result.words[i].word, expectedWords[i].word)
            XCTAssertEqual(result.words[i].startSec, expectedWords[i].startSec, accuracy: 0.1)
            XCTAssertEqual(result.words[i].endSec, expectedWords[i].endSec, accuracy: 0.1)
            XCTAssertEqual(result.words[i].confidence, expectedWords[i].confidence, accuracy: 0.1)
        }
    }

    func testVersion() throws {
        XCTAssertGreaterThan(Leopard.version, "")
    }

    func testSampleRate() throws {
        XCTAssertGreaterThan(Leopard.sampleRate, 0)
    }
}
