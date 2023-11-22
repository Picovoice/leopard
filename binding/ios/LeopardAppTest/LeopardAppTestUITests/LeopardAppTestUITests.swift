//
//  Copyright 2022-2023 Picovoice Inc.
//  You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
//  file accompanying this source.
//  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
//  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
//  specific language governing permissions and limitations under the License.
//

import AVFoundation
import XCTest
import Leopard

extension String {
    subscript(index: Int) -> Character {
        return self[self.index(self.startIndex, offsetBy: index)]
    }
}

extension String {
    public func levenshtein(_ other: String) -> Int {
        let sCount = self.count
        let oCount = other.count

        guard sCount != 0 else {
            return oCount
        }

        guard oCount != 0 else {
            return sCount
        }

        let line: [Int]  = Array(repeating: 0, count: oCount + 1)
        var mat: [[Int]] = Array(repeating: line, count: sCount + 1)

        for i in 0...sCount {
            mat[i][0] = i
        }

        for j in 0...oCount {
            mat[0][j] = j
        }

        for j in 1...oCount {
            for i in 1...sCount {
                if self[i - 1] == other[j - 1] {
                    mat[i][j] = mat[i - 1][j - 1]       // no operation
                } else {
                    let del = mat[i - 1][j] + 1         // deletion
                    let ins = mat[i][j - 1] + 1         // insertion
                    let sub = mat[i - 1][j - 1] + 1     // substitution
                    mat[i][j] = min(min(del, ins), sub)
                }
            }
        }

        return mat[sCount][oCount]
    }
}

struct TestData: Decodable {
    var tests: Tests
}

struct Tests: Decodable {
    var language_tests: [LanguageTest]
    var diarization_tests: [DiarizationTest]
}

struct LanguageTest: Decodable {
    var language: String
    var audio_file: String
    var transcript: String
    var transcript_with_punctuation: String
    var error_rate: Float
    var words: [LanguageTestWord]
}

struct DiarizationTest: Decodable {
    var language: String
    var audio_file: String
    var words: [DiarizationTestWord]
}

struct LanguageTestWord: Decodable {
    var word: String
    var start_sec: Float
    var end_sec: Float
    var confidence: Float
    var speaker_tag: Int
}

struct DiarizationTestWord: Decodable {
    var word: String
    var speaker_tag: Int
}

class LeopardAppTestUITests: XCTestCase {
    let accessKey: String = "{TESTING_ACCESS_KEY_HERE}"

    override func setUpWithError() throws {
        continueAfterFailure = true
    }

    func characterErrorRate(transcript: String, expectedTranscript: String) -> Float {
        return Float(transcript.levenshtein(expectedTranscript)) / Float(expectedTranscript.count)
    }

    func validateMetadata(words: [LeopardWord], expectedWords: [LanguageTestWord], enableDiarization: Bool) {
        for i in 0..<words.count {
            XCTAssert(words[i].word == expectedWords[i].word)
            XCTAssert(abs(words[i].startSec - expectedWords[i].start_sec) < 0.01)
            XCTAssert(abs(words[i].endSec - expectedWords[i].end_sec) < 0.01)
            XCTAssert(abs(words[i].confidence - expectedWords[i].confidence) < 0.01)
            if enableDiarization {
                XCTAssert(words[i].speakerTag == expectedWords[i].speaker_tag)
            } else {
                XCTAssert(words[i].speakerTag == -1)
            }
        }
    }

    func runTestProcess(
            modelPath: String,
            expectedWords: [LanguageTestWord],
            testAudio: String,
            expectedTranscript: String? = nil,
            errorRate: Float = -1.0,
            enableAutomaticPunctuation: Bool = false,
            enableDiarization: Bool = false) throws {
        let bundle = Bundle(for: type(of: self))
        let audioFileURL: URL = bundle.url(
                forResource: testAudio,
                withExtension: "",
                subdirectory: "test_resources/audio_samples")!

        let leopard = try? Leopard(
                accessKey: accessKey,
                modelPath: modelPath,
                enableAutomaticPunctuation: enableAutomaticPunctuation,
                enableDiarization: enableDiarization)

        let data = try Data(contentsOf: audioFileURL)
        var pcmBuffer = [Int16](repeating: 0, count: ((data.count - 44) / MemoryLayout<Int16>.size))
        _ = pcmBuffer.withUnsafeMutableBytes {
            data.copyBytes(to: $0, from: 44..<data.count)
        }

        let result = try leopard!.process(pcmBuffer)
        leopard!.delete()

        if errorRate != -1.0 && expectedTranscript != nil {
            XCTAssert(characterErrorRate(
                transcript: result.transcript,
                expectedTranscript: expectedTranscript!) < errorRate)
        }
        validateMetadata(
                words: result.words,
                expectedWords: expectedWords,
                enableDiarization: enableDiarization)
    }

    func runTestProcessFile(
            modelPath: String,
            expectedWords: [LanguageTestWord],
            testAudio: String,
            expectedTranscript: String? = nil,
            errorRate: Float = -1.0,
            enableAutomaticPunctuation: Bool = false,
            enableDiarization: Bool = false) throws {
        let bundle = Bundle(for: type(of: self))

        let leopard = try? Leopard(
                accessKey: accessKey,
                modelPath: modelPath,
                enableAutomaticPunctuation: enableAutomaticPunctuation,
                enableDiarization: enableDiarization)

        let audioFilePath: String = bundle.path(
                forResource: testAudio,
                ofType: "",
                inDirectory: "test_resources/audio_samples")!
        let result = try leopard!.processFile(audioFilePath)
        leopard!.delete()

        if errorRate != -1.0 && expectedTranscript != nil {
            XCTAssert(characterErrorRate(
                transcript: result.transcript,
                expectedTranscript: expectedTranscript!) < errorRate)
        }
        validateMetadata(
                words: result.words,
                expectedWords: expectedWords,
                enableDiarization: enableDiarization)
    }

    func runTestProcessURL(
            modelURL: URL,
            expectedWords: [LanguageTestWord],
            testAudio: String,
            expectedTranscript: String? = nil,
            errorRate: Float = -1.0,
            enableAutomaticPunctuation: Bool = false,
            enableDiarization: Bool = false) throws {
        let bundle = Bundle(for: type(of: self))
        let audioFileURL: URL = bundle.url(
                forResource: testAudio,
                withExtension: "",
                subdirectory: "test_resources/audio_samples")!

        let leopard = try? Leopard(
                accessKey: accessKey,
                modelURL: modelURL,
                enableAutomaticPunctuation: enableAutomaticPunctuation,
                enableDiarization: enableDiarization)

        let result = try leopard!.processFile(audioFileURL)
        leopard!.delete()

        if errorRate != -1.0 && expectedTranscript != nil {
            XCTAssert(characterErrorRate(
                transcript: result.transcript,
                expectedTranscript: expectedTranscript!) < errorRate)
        }
        validateMetadata(
                words: result.words,
                expectedWords: expectedWords,
                enableDiarization: enableDiarization)
    }

    func testProcess() throws {
        let bundle = Bundle(for: type(of: self))
        let testDataJsonUrl = bundle.url(
            forResource: "test_data",
            withExtension: "json",
            subdirectory: "test_resources")!
        let testDataJsonData = try Data(contentsOf: testDataJsonUrl)
        let testData = try JSONDecoder().decode(TestData.self, from: testDataJsonData)

        for testCase in testData.tests.language_tests {
            let suffix = testCase.language == "en" ? "" : "_\(testCase.language)"
            let modelPath: String = bundle.path(
                forResource: "leopard_params\(suffix)",
                ofType: "pv",
                inDirectory: "test_resources/model_files")!

            try XCTContext.runActivity(named: "(\(testCase.language))") { _ in
                try runTestProcess(
                        modelPath: modelPath,
                        expectedWords: testCase.words,
                        testAudio: testCase.audio_file,
                        expectedTranscript: testCase.transcript,
                        errorRate: testCase.error_rate)
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

        for testCase in testData.tests.language_tests {
            let suffix = testCase.language == "en" ? "" : "_\(testCase.language)"
            let modelPath: String = bundle.path(
                forResource: "leopard_params\(suffix)",
                ofType: "pv",
                inDirectory: "test_resources/model_files")!

            try XCTContext.runActivity(named: "(\(testCase.language))") { _ in
                try runTestProcess(
                        modelPath: modelPath,
                        expectedWords: testCase.words,
                        testAudio: testCase.audio_file,
                        expectedTranscript: testCase.transcript_with_punctuation,
                        errorRate: testCase.error_rate,
                        enableAutomaticPunctuation: true)
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

        for testCase in testData.tests.language_tests {
            let suffix = testCase.language == "en" ? "" : "_\(testCase.language)"
            let modelPath: String = bundle.path(
                forResource: "leopard_params\(suffix)",
                ofType: "pv",
                inDirectory: "test_resources/model_files")!

            try XCTContext.runActivity(named: "(\(testCase.language))") { _ in
                try runTestProcessFile(
                        modelPath: modelPath,
                        expectedWords: testCase.words,
                        testAudio: testCase.audio_file,
                        expectedTranscript: testCase.transcript,
                        errorRate: testCase.error_rate)
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

        for testCase in testData.tests.language_tests {
            let suffix = testCase.language == "en" ? "" : "_\(testCase.language)"
            let modelURL: URL = bundle.url(
                forResource: "leopard_params\(suffix)",
                withExtension: "pv",
                subdirectory: "test_resources/model_files")!

            try XCTContext.runActivity(named: "(\(testCase.language))") { _ in
                try runTestProcessURL(
                        modelURL: modelURL,
                        expectedWords: testCase.words,
                        testAudio: testCase.audio_file,
                        expectedTranscript: testCase.transcript,
                        errorRate: testCase.error_rate)
            }
        }
    }

    func testProcessFileWithDiarization() throws {
        let bundle = Bundle(for: type(of: self))
        let testDataJsonUrl = bundle.url(
            forResource: "test_data",
            withExtension: "json",
            subdirectory: "test_resources")!
        let testDataJsonData = try Data(contentsOf: testDataJsonUrl)
        let testData = try JSONDecoder().decode(TestData.self, from: testDataJsonData)

        for testCase in testData.tests.language_tests {
            let suffix = testCase.language == "en" ? "" : "_\(testCase.language)"
            let modelPath: String = bundle.path(
                forResource: "leopard_params\(suffix)",
                ofType: "pv",
                inDirectory: "test_resources/model_files")!

            try XCTContext.runActivity(named: "(\(testCase.language))") { _ in
                try runTestProcessFile(
                        modelPath: modelPath,
                        expectedWords: testCase.words,
                        testAudio: testCase.audio_file,
                        enableDiarization: true)
            }
        }
    }

    func testDiarizationMultipleSpeakers() throws {
        let bundle = Bundle(for: type(of: self))
        let testDataJsonUrl = bundle.url(
            forResource: "test_data",
            withExtension: "json",
            subdirectory: "test_resources")!
        let testDataJsonData = try Data(contentsOf: testDataJsonUrl)
        let testData = try JSONDecoder().decode(TestData.self, from: testDataJsonData)

        for testCase in testData.tests.diarization_tests {
            let suffix = testCase.language == "en" ? "" : "_\(testCase.language)"
            let modelPath: String = bundle.path(
                forResource: "leopard_params\(suffix)",
                ofType: "pv",
                inDirectory: "test_resources/model_files")!

            try XCTContext.runActivity(named: "(\(testCase.language))") { _ in
                let leopard = try? Leopard(
                    accessKey: accessKey,
                    modelPath: modelPath,
                    enableDiarization: true)

                let audioFilePath: String = bundle.path(
                    forResource: testCase.audio_file,
                    ofType: "",
                    inDirectory: "test_resources/audio_samples")!
                let result = try leopard!.processFile(audioFilePath)
                leopard!.delete()

                XCTAssert(result.words.count == testCase.words.count)
                for i in 0..<result.words.count {
                    XCTAssert(result.words[i].word == testCase.words[i].word)
                    XCTAssert(result.words[i].speakerTag == testCase.words[i].speaker_tag)
                }
            }
        }
    }

    func testVersion() throws {
        XCTAssertGreaterThan(Leopard.version, "")
    }

    func testSampleRate() throws {
        XCTAssertGreaterThan(Leopard.sampleRate, 0)
    }

    func testMessageStack() throws {
        let bundle = Bundle(for: type(of: self))
        let modelPath: String = bundle.path(
            forResource: "leopard_params",
            ofType: "pv",
            inDirectory: "test_resources/model_files")!

        var first_error: String = ""
        do {
            let leopard = try Leopard.init(accessKey: "invalid", modelPath: modelPath)
            XCTAssertNil(leopard)
        } catch {
            first_error = "\(error.localizedDescription)"
            XCTAssert(first_error.count < 1024)
        }

        do {
            let leopard = try Leopard.init(accessKey: "invalid", modelPath: modelPath)
            XCTAssertNil(leopard)
        } catch {
            XCTAssert("\(error.localizedDescription)".count == first_error.count)
        }
    }

    func testProcessMessageStack() throws {
        let bundle = Bundle(for: type(of: self))
        let modelPath: String = bundle.path(
            forResource: "leopard_params",
            ofType: "pv",
            inDirectory: "test_resources/model_files")!

        let leopard = try Leopard.init(accessKey: accessKey, modelPath: modelPath)
        leopard.delete()

        var testPcm: [Int16] = []
        testPcm.reserveCapacity(512)

        do {
            let res = try leopard.process(testPcm)
            XCTAssertNil(res)
        } catch {
            XCTAssert("\(error.localizedDescription)".count > 0)
        }
    }
}
