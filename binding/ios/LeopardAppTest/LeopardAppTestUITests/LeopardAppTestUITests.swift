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
import SwiftyLevenshtein

struct TestData: Decodable {
    var tests: TestDataTests
}

struct TestDataTests: Decodable {
    var parameters: [ParametersTest]
}

struct ParametersTest: Decodable {
    var language: String
    var audio_file: String
    var transcript: String
    var punctuations: [String]
    var error_rate: Float
}

class LeopardAppTestUITests: XCTestCase {
    let accessKey: String = "{TESTING_ACCESS_KEY_HERE}"

    override func setUp() {
        super.setUp()
    }

    override func tearDown() {
        super.tearDown()

    }

    override func setUpWithError() throws {
        continueAfterFailure = true
    }

    func characterErrorRate(transcript: String, expectedTranscript: String) -> Float {
        return Float(levenshtein(sourceString: transcript, target: expectedTranscript)) / Float(expectedTranscript.count)
    }
    
    func validateMetadata(transcript: String, words: [LeopardWord], audioLength: Float) {
        let normTranscript = transcript.uppercased()
        for word in words {
            XCTAssert(normTranscript.contains(word.word.uppercased()))
            XCTAssert(word.startSec > 0.0)
            XCTAssert(word.startSec <= word.endSec)
            XCTAssert(word.endSec < audioLength)
            XCTAssert(word.confidence >= 0.0 && word.confidence <= 1.0)
        }
    }
    
    func runTestProcess(modelPath: String, transcript: String, punctuations: [String], testPunctuation: Bool, errorRate: Float, testAudio: String) throws {
        let bundle = Bundle(for: type(of: self))
        let audioFileURL: URL = bundle.url(forResource: testAudio, withExtension: "", subdirectory: "test_resources/audio_samples")!
        
        var normTranscript = transcript
        if (!testPunctuation) {
            for punc in punctuations {
                normTranscript = normTranscript.replacingOccurrences(of: punc, with: "")
            }
        }
        
        let leopard = try? Leopard(
                accessKey: accessKey,
                modelPath: modelPath,
                enableAutomaticPunctuation: testPunctuation)

        let data = try Data(contentsOf: audioFileURL)
        var pcmBuffer = Array<Int16>(repeating: 0, count: (data.count / MemoryLayout<Int16>.size))
        _ = pcmBuffer.withUnsafeMutableBytes {
            data.copyBytes(to: $0, from: 0..<data.count)
        }

        let result = try leopard!.process(pcmBuffer)
        leopard!.delete()
        
        XCTAssert(characterErrorRate(transcript: result.transcript, expectedTranscript: normTranscript) < errorRate)
        validateMetadata(transcript: result.transcript, words: result.words, audioLength: Float(pcmBuffer.count) / Float(Leopard.sampleRate))
    }
    
    func runTestProcessFile(modelPath: String, transcript: String, punctuations: [String], testPunctuation: Bool, errorRate: Float, testAudio: String) throws {
        let bundle = Bundle(for: type(of: self))
        let audioFileURL: URL = bundle.url(forResource: testAudio, withExtension: "", subdirectory: "test_resources/audio_samples")!
        
        var normTranscript = transcript
        if (!testPunctuation) {
            for punc in punctuations {
                normTranscript = normTranscript.replacingOccurrences(of: punc, with: "")
            }
        }
        
        let leopard = try? Leopard(
                accessKey: accessKey,
                modelPath: modelPath,
                enableAutomaticPunctuation: testPunctuation)

        let data = try Data(contentsOf: audioFileURL)
        var pcmBuffer = Array<Int16>(repeating: 0, count: (data.count / MemoryLayout<Int16>.size))
        _ = pcmBuffer.withUnsafeMutableBytes {
            data.copyBytes(to: $0, from: 0..<data.count)
        }

        let audioFilePath: String = bundle.path(forResource: testAudio, ofType: "", inDirectory: "test_resources/audio_samples")!
        let result = try leopard!.processFile(audioFilePath)
        leopard!.delete()
        
        XCTAssert(characterErrorRate(transcript: result.transcript, expectedTranscript: normTranscript) < errorRate)
        validateMetadata(transcript: result.transcript, words: result.words, audioLength: Float(pcmBuffer.count) / Float(Leopard.sampleRate))
    }
    
    func runTestProcessURL(modelURL: URL, transcript: String, punctuations: [String], testPunctuation: Bool, errorRate: Float, testAudio: String) throws {
        let bundle = Bundle(for: type(of: self))
        let audioFileURL: URL = bundle.url(forResource: testAudio, withExtension: "", subdirectory: "test_resources/audio_samples")!
        
        var normTranscript = transcript
        if (!testPunctuation) {
            for punc in punctuations {
                normTranscript = normTranscript.replacingOccurrences(of: punc, with: "")
            }
        }

        let leopard = try? Leopard(
                accessKey: accessKey,
                modelURL: modelURL,
                enableAutomaticPunctuation: testPunctuation)

        let data = try Data(contentsOf: audioFileURL)
        var pcmBuffer = Array<Int16>(repeating: 0, count: (data.count / MemoryLayout<Int16>.size))
        _ = pcmBuffer.withUnsafeMutableBytes {
            data.copyBytes(to: $0, from: 0..<data.count)
        }

        let result = try leopard!.processFile(audioFileURL)
        leopard!.delete()
        
        XCTAssert(characterErrorRate(transcript: result.transcript, expectedTranscript: normTranscript) < errorRate)
        validateMetadata(transcript: result.transcript, words: result.words, audioLength: Float(pcmBuffer.count) / Float(Leopard.sampleRate))
    }
    
    func testProcess() throws {
        let bundle = Bundle(for: type(of: self))
        let testDataJsonUrl = bundle.url(
            forResource: "test_data",
            withExtension: "json",
            subdirectory: "test_resources")!
        let testDataJsonData = try Data(contentsOf: testDataJsonUrl)
        let testData = try JSONDecoder().decode(TestData.self, from: testDataJsonData)
        
        for testCase in testData.tests.parameters {
            let suffix = testCase.language == "en" ? "" : "_\(testCase.language)"
            let modelPath: String = bundle.path(
                forResource: "leopard_params\(suffix)",
                ofType: "pv",
                inDirectory: "test_resources/model_files")!

            try XCTContext.runActivity(named: "(\(testCase.language))") { _ in
                try runTestProcess(modelPath: modelPath, transcript: testCase.transcript, punctuations: testCase.punctuations, testPunctuation: false, errorRate: testCase.error_rate, testAudio: testCase.audio_file);
            }
        }
    }
    
    func testProcessPunctuation() throws {
        let bundle = Bundle(for: type(of: self))
        let testDataJsonUrl = bundle.url(
            forResource: "test_data",
            withExtension: "json",
            subdirectory: "test_resources")!
        let testDataJsonData = try Data(contentsOf: testDataJsonUrl)
        let testData = try JSONDecoder().decode(TestData.self, from: testDataJsonData)
        
        for testCase in testData.tests.parameters {
            let suffix = testCase.language == "en" ? "" : "_\(testCase.language)"
            let modelPath: String = bundle.path(
                forResource: "leopard_params\(suffix)",
                ofType: "pv",
                inDirectory: "test_resources/model_files")!

            try XCTContext.runActivity(named: "(\(testCase.language))") { _ in
                try runTestProcess(modelPath: modelPath, transcript: testCase.transcript, punctuations: testCase.punctuations, testPunctuation: true, errorRate: testCase.error_rate, testAudio: testCase.audio_file);
            }
        }
    }
    
    func testProcessFile() throws {
        let bundle = Bundle(for: type(of: self))
        let testDataJsonUrl = bundle.url(
            forResource: "test_data",
            withExtension: "json",
            subdirectory: "test_resources")!
        let testDataJsonData = try Data(contentsOf: testDataJsonUrl)
        let testData = try JSONDecoder().decode(TestData.self, from: testDataJsonData)
        
        for testCase in testData.tests.parameters {
            let suffix = testCase.language == "en" ? "" : "_\(testCase.language)"
            let modelPath: String = bundle.path(
                forResource: "leopard_params\(suffix)",
                ofType: "pv",
                inDirectory: "test_resources/model_files")!

            try XCTContext.runActivity(named: "(\(testCase.language))") { _ in
                try runTestProcessFile(modelPath: modelPath, transcript: testCase.transcript, punctuations: testCase.punctuations, testPunctuation: false, errorRate: testCase.error_rate, testAudio: testCase.audio_file);
            }
        }
    }

    func testProcessURL() throws {
        let bundle = Bundle(for: type(of: self))
        let testDataJsonUrl = bundle.url(
            forResource: "test_data",
            withExtension: "json",
            subdirectory: "test_resources")!
        let testDataJsonData = try Data(contentsOf: testDataJsonUrl)
        let testData = try JSONDecoder().decode(TestData.self, from: testDataJsonData)
        
        for testCase in testData.tests.parameters {
            let suffix = testCase.language == "en" ? "" : "_\(testCase.language)"
            let modelURL: URL = bundle.url(
                forResource: "leopard_params\(suffix)",
                withExtension: "pv",
                subdirectory: "test_resources/model_files")!

            try XCTContext.runActivity(named: "(\(testCase.language))") { _ in
                try runTestProcessURL(modelURL: modelURL, transcript: testCase.transcript, punctuations: testCase.punctuations, testPunctuation: false, errorRate: testCase.error_rate, testAudio: testCase.audio_file);
            }
        }
    }

    func testVersion() throws {
        XCTAssertGreaterThan(Leopard.version, "")
    }

    func testSampleRate() throws {
        XCTAssertGreaterThan(Leopard.sampleRate, 0)
    }
}
