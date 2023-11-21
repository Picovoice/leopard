/*
    Copyright 2022-2023 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
*/

#[cfg(test)]
mod tests {
    use distance::*;
    use itertools::Itertools;
    use rodio::{source::Source, Decoder};
    use serde::Deserialize;
    use std::env;
    use std::fs::{read_to_string, File};
    use std::io::BufReader;

    use leopard::{LeopardBuilder, LeopardWord};

    #[derive(Debug, Deserialize)]
    struct WordJson {
        word: String,
        start_sec: Option<f32>,
        end_sec: Option<f32>,
        confidence: Option<f32>,
        speaker_tag: i32,
    }

    #[derive(Debug, Deserialize)]
    struct LanguageTestJson {
        language: String,
        audio_file: String,
        transcript: String,
        transcript_with_punctuation: String,
        error_rate: f32,
        words: Vec<WordJson>,
    }

    #[derive(Debug, Deserialize)]
    struct DiarizationTestJson {
        language: String,
        audio_file: String,
        words: Vec<WordJson>,
    }

    #[derive(Debug, Deserialize)]
    struct TestsJson {
        language_tests: Vec<LanguageTestJson>,
        diarization_tests: Vec<DiarizationTestJson>,
    }

    #[derive(Debug, Deserialize)]
    struct RootJson {
        tests: TestsJson,
    }

    fn append_lang(path: &str, language: &str) -> String {
        if language == "en" {
            String::from(path)
        } else {
            format!("{}_{}", path, language)
        }
    }

    fn load_test_data() -> TestsJson {
        let test_json_path = format!(
            "{}{}",
            env!("CARGO_MANIFEST_DIR"),
            "/../../resources/.test/test_data.json"
        );
        let contents: String =
            read_to_string(test_json_path).expect("Unable to read test_data.json");
        let root: RootJson = serde_json::from_str(&contents).expect("Failed to parse JSON");
        root.tests
    }

    fn model_path_by_language(language: &str) -> String {
        format!(
            "{}{}{}",
            env!("CARGO_MANIFEST_DIR"),
            append_lang("/../../lib/common/leopard_params", language),
            ".pv"
        )
    }

    fn character_error_rate(transcript: &str, expected_transcript: &str) -> f32 {
        let distance = levenshtein(transcript, expected_transcript);
        return distance as f32 / expected_transcript.len() as f32;
    }

    fn validate_metadata(words: Vec<LeopardWord>, reference_words: Vec<WordJson>, enable_diarization: bool) {
        for i in 0..words.len() {
            let leopard_word = words.get(i).unwrap().clone();
            let reference_word = reference_words.get(i).unwrap().clone();
            assert!(&leopard_word.word.to_uppercase() == &reference_word.word.to_uppercase());
            assert!((leopard_word.start_sec-reference_word.start_sec.unwrap()).abs() <= 0.1);
            assert!((leopard_word.end_sec-reference_word.end_sec.unwrap()).abs() <= 0.1);
            assert!((leopard_word.confidence-reference_word.confidence.unwrap()).abs() <= 0.1);
            if enable_diarization {
                assert!(leopard_word.speaker_tag == reference_word.speaker_tag);
            } else {
                assert!(leopard_word.speaker_tag == -1);
            }
        }
    }

    fn run_test_process(
        language: &str,
        transcript: &str,
        enable_automatic_punctuation: bool,
        enable_diarization: bool,
        error_rate: f32,
        test_audio: &str,
        words: Vec<WordJson>
    ) {
        let access_key = env::var("PV_ACCESS_KEY")
            .expect("Pass the AccessKey in using the PV_ACCESS_KEY env variable");

        let model_path = model_path_by_language(language);

        let audio_path = format!(
            "{}{}{}",
            env!("CARGO_MANIFEST_DIR"),
            "/../../resources/audio_samples/",
            test_audio
        );

        let audio_file = BufReader::new(File::open(&audio_path).expect(&audio_path));
        let source = Decoder::new(audio_file).unwrap();

        let leopard = LeopardBuilder::new()
            .access_key(access_key)
            .model_path(model_path)
            .enable_automatic_punctuation(enable_automatic_punctuation)
            .enable_diarization(enable_diarization)
            .init()
            .expect("Unable to create Leopard");

        assert_eq!(leopard.sample_rate(), source.sample_rate());
        let result = leopard.process(&source.collect_vec()).unwrap();

        assert!(character_error_rate(&result.transcript, &transcript) < error_rate);
        validate_metadata(result.words, words, enable_diarization);
    }

    fn run_test_process_file(
        language: &str,
        transcript: &str,
        enable_automatic_punctuation: bool,
        enable_diarization: bool,
        error_rate: f32,
        test_audio: &str,
        words: Vec<WordJson>
    ) {
        let access_key = env::var("PV_ACCESS_KEY")
            .expect("Pass the AccessKey in using the PV_ACCESS_KEY env variable");

        let model_path = model_path_by_language(language);

        let audio_path = format!(
            "{}{}{}",
            env!("CARGO_MANIFEST_DIR"),
            "/../../resources/audio_samples/",
            test_audio
        );

        let leopard = LeopardBuilder::new()
            .access_key(access_key)
            .model_path(model_path)
            .enable_automatic_punctuation(enable_automatic_punctuation)
            .enable_diarization(enable_diarization)
            .init()
            .expect("Unable to create Leopard");

        let result = leopard.process_file(audio_path).unwrap();

        assert!(character_error_rate(&result.transcript, &transcript) < error_rate);
        validate_metadata(result.words, words, enable_diarization);
    }

    fn run_test_diarization(
        language: &str,
        test_audio: &str,
        reference_words: Vec<WordJson>
    ) {
        let access_key = env::var("PV_ACCESS_KEY")
            .expect("Pass the AccessKey in using the PV_ACCESS_KEY env variable");

        let model_path = model_path_by_language(language);

        let audio_path = format!(
            "{}{}{}",
            env!("CARGO_MANIFEST_DIR"),
            "/../../resources/audio_samples/",
            test_audio
        );

        let leopard = LeopardBuilder::new()
            .access_key(access_key)
            .model_path(model_path)
            .enable_diarization(true)
            .init()
            .expect("Unable to create Leopard");

        let result = leopard.process_file(audio_path).unwrap();

        for i in 0..result.words.len() {
            let leopard_word = result.words.get(i).unwrap().clone();
            let reference_word = reference_words.get(i).unwrap().clone();
            assert!(&leopard_word.word.to_uppercase() == &reference_word.word.to_uppercase());
            assert!(leopard_word.speaker_tag == reference_word.speaker_tag);
        }
    }

    #[test]
    fn test_process() -> Result<(), String> {
        let test_json: TestsJson = load_test_data();

        for t in test_json.language_tests {
            run_test_process(
                &t.language,
                &t.transcript,
                false,
                false,
                t.error_rate,
                &t.audio_file,
                t.words
            );
        }
        Ok(())
    }

    #[test]
    fn test_process_file() -> Result<(), String> {
        let test_json: TestsJson = load_test_data();

        for t in test_json.language_tests {
            run_test_process_file(
                &t.language,
                &t.transcript,
                false,
                false,
                t.error_rate,
                &t.audio_file,
                t.words
            );
        }
        Ok(())
    }


    #[test]
    fn test_process_file_punctuation() -> Result<(), String> {
        let test_json: TestsJson = load_test_data();

        for t in test_json.language_tests {
            run_test_process_file(
                &t.language,
                &t.transcript_with_punctuation,
                true,
                false,
                t.error_rate,
                &t.audio_file,
                t.words
            );
        }
        Ok(())
    }

    #[test]
    fn test_process_file_diarization() -> Result<(), String> {
        let test_json: TestsJson = load_test_data();

        for t in test_json.language_tests {
            run_test_process_file(
                &t.language,
                &t.transcript,
                false,
                true,
                t.error_rate,
                &t.audio_file,
                t.words
            );
        }
        Ok(())
    }

    #[test]
    fn test_diarization() -> Result<(), String> {
        let test_json: TestsJson = load_test_data();

        for t in test_json.diarization_tests {
            run_test_diarization(
                &t.language,
                &t.audio_file,
                t.words
            );
        }
        Ok(())
    }

    #[test]
    fn test_error_stack() {
        let mut error_stack = Vec::new();

        let res = LeopardBuilder::new()
            .access_key("invalid")
            .init();

        if let Err(err) = res {
            error_stack = err.message_stack
        }

        assert!(0 < error_stack.len() && error_stack.len() <= 8);

        let res = LeopardBuilder::new()
            .access_key("invalid")
            .init();
        if let Err(err) = res {
            assert_eq!(error_stack.len(), err.message_stack.len());
            for i in 0..error_stack.len() {
                assert_eq!(error_stack[i], err.message_stack[i])
            }
        }
    }

    #[test]
    fn test_version() {
        let access_key = env::var("PV_ACCESS_KEY")
            .expect("Pass the AccessKey in using the PV_ACCESS_KEY env variable");

        let leopard = LeopardBuilder::new()
            .access_key(access_key)
            .init()
            .expect("Unable to create Leopard");

        assert_ne!(leopard.version(), "")
    }
}