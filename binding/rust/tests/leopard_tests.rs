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
    use serde_json::Value;
    use std::env;
    use std::fs::{read_to_string, File};
    use std::io::BufReader;

    use leopard::{LeopardBuilder, LeopardTranscript};

    fn append_lang(path: &str, language: &str) -> String {
        if language == "en" {
            String::from(path)
        } else {
            format!("{}_{}", path, language)
        }
    }

    fn load_test_data() -> Value {
        let test_json_path = format!(
            "{}{}",
            env!("CARGO_MANIFEST_DIR"),
            "/../../resources/.test/test_data.json"
        );
        let contents: String =
            read_to_string(test_json_path).expect("Unable to read test_data.json");
        let test_json: Value =
            serde_json::from_str(&contents).expect("Unable to parse test_data.json");
        test_json
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

    fn validate_metadata(leopard_transcript: LeopardTranscript, audio_length: f32) {
        let norm_transcript = leopard_transcript.transcript.to_uppercase();
        for i in 0..leopard_transcript.words.len() {
            let leopard_word = leopard_transcript.words.get(i).unwrap().clone();

            assert!(norm_transcript.contains(&leopard_word.word.to_uppercase()));
            assert!(leopard_word.start_sec > 0.0);
            assert!(leopard_word.start_sec <= leopard_word.end_sec);
            if i < (leopard_transcript.words.len() - 1) {
                let next_leopard_word = leopard_transcript.words.get(i + 1).unwrap().clone();
                assert!(leopard_word.end_sec <= next_leopard_word.start_sec);
            }
            assert!(leopard_word.end_sec <= audio_length);
            assert!(leopard_word.confidence >= 0.0 && leopard_word.confidence <= 1.0);
        }
    }

    fn run_test_process(
        language: &str,
        transcript: &str,
        punctuations: Vec<&str>,
        test_punctuation: bool,
        error_rate: f32,
        test_audio: &str,
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

        let mut norm_transcript = transcript.to_string();
        if !test_punctuation {
            punctuations.iter().for_each(|p| {
                norm_transcript = norm_transcript.replace(p, "");
            });
        }

        let audio_file = BufReader::new(File::open(&audio_path).expect(&audio_path));
        let source = Decoder::new(audio_file).unwrap();

        let leopard = LeopardBuilder::new()
            .access_key(access_key)
            .model_path(model_path)
            .enable_automatic_punctuation(test_punctuation)
            .init()
            .expect("Unable to create Leopard");

        assert_eq!(leopard.sample_rate(), source.sample_rate());
        let audio_file_duration = source.total_duration().unwrap().as_secs_f32();
        let result = leopard.process(&source.collect_vec()).unwrap();

        assert!(character_error_rate(&result.transcript, &norm_transcript) < error_rate);
        validate_metadata(result, audio_file_duration);
    }

    fn run_test_process_file(
        language: &str,
        transcript: &str,
        punctuations: Vec<&str>,
        test_punctuation: bool,
        error_rate: f32,
        test_audio: &str,
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

        let mut norm_transcript = transcript.to_string();
        if !test_punctuation {
            punctuations.iter().for_each(|p| {
                norm_transcript = norm_transcript.replace(p, "");
            });
        }

        let audio_file = BufReader::new(File::open(&audio_path).expect(&audio_path));
        let source = Decoder::new(audio_file).unwrap();

        let leopard = LeopardBuilder::new()
            .access_key(access_key)
            .model_path(model_path)
            .enable_automatic_punctuation(test_punctuation)
            .init()
            .expect("Unable to create Leopard");

        assert_eq!(leopard.sample_rate(), source.sample_rate());
        let audio_file_duration = source.total_duration().unwrap().as_secs_f32();
        let result = leopard.process_file(audio_path).unwrap();

        assert!(character_error_rate(&result.transcript, &norm_transcript) < error_rate);
        validate_metadata(result, audio_file_duration);
    }

    #[test]
    fn test_process() -> Result<(), String> {
        let test_json: Value = load_test_data();

        for t in test_json["tests"]["parameters"].as_array().unwrap() {
            let language = t["language"].as_str().unwrap();
            let transcript = t["transcript"].as_str().unwrap();
            let punctuations = t["punctuations"]
                .as_array()
                .unwrap()
                .iter()
                .map(|v| v.as_str().unwrap())
                .collect_vec();
            let error_rate = t["error_rate"].as_f64().unwrap() as f32;

            let test_audio = t["audio_file"].as_str().unwrap();

            run_test_process(
                language,
                transcript,
                punctuations,
                false,
                error_rate,
                &test_audio,
            );
        }
        Ok(())
    }

    #[test]
    fn test_process_punctuation() -> Result<(), String> {
        let test_json: Value = load_test_data();

        for t in test_json["tests"]["parameters"].as_array().unwrap() {
            let language = t["language"].as_str().unwrap();
            let transcript = t["transcript"].as_str().unwrap();
            let punctuations = t["punctuations"]
                .as_array()
                .unwrap()
                .iter()
                .map(|v| v.as_str().unwrap())
                .collect_vec();
            let error_rate = t["error_rate"].as_f64().unwrap() as f32;

            let test_audio = t["audio_file"].as_str().unwrap();

            run_test_process(
                language,
                transcript,
                punctuations,
                true,
                error_rate,
                &test_audio,
            );
        }
        Ok(())
    }

    #[test]
    fn test_process_file() -> Result<(), String> {
        let test_json: Value = load_test_data();

        for t in test_json["tests"]["parameters"].as_array().unwrap() {
            let language = t["language"].as_str().unwrap();
            let transcript = t["transcript"].as_str().unwrap();
            let punctuations = t["punctuations"]
                .as_array()
                .unwrap()
                .iter()
                .map(|v| v.as_str().unwrap())
                .collect_vec();
            let error_rate = t["error_rate"].as_f64().unwrap() as f32;

            let test_audio = t["audio_file"].as_str().unwrap();

            run_test_process_file(
                language,
                transcript,
                punctuations,
                false,
                error_rate,
                &test_audio,
            );
        }
        Ok(())
    }

    #[test]
    fn test_process_file_punctuation() -> Result<(), String> {
        let test_json: Value = load_test_data();

        for t in test_json["tests"]["parameters"].as_array().unwrap() {
            let language = t["language"].as_str().unwrap();
            let transcript = t["transcript"].as_str().unwrap();
            let punctuations = t["punctuations"]
                .as_array()
                .unwrap()
                .iter()
                .map(|v| v.as_str().unwrap())
                .collect_vec();
            let error_rate = t["error_rate"].as_f64().unwrap() as f32;

            let test_audio = t["audio_file"].as_str().unwrap();

            run_test_process_file(
                language,
                transcript,
                punctuations,
                true,
                error_rate,
                &test_audio,
            );
        }
        Ok(())
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
