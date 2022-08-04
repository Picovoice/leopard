/*
    Copyright 2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
*/

#[cfg(test)]
mod tests {
    use itertools::Itertools;
    use rodio::{source::Source, Decoder};
    use std::env;
    use std::fs::File;
    use std::io::BufReader;

    use leopard::LeopardBuilder;

    #[test]
    fn test_process() {
        let access_key = env::var("PV_ACCESS_KEY")
            .expect("Pass the AccessKey in using the PV_ACCESS_KEY env variable");

        let audio_path = format!(
            "{}{}",
            env!("CARGO_MANIFEST_DIR"),
            "/../../resources/audio_samples/test.wav",
        );

        let audio_file = BufReader::new(File::open(&audio_path).expect(&audio_path));
        let source = Decoder::new(audio_file).unwrap();

        let leopard = LeopardBuilder::new()
            .access_key(access_key)
            .init()
            .expect("Unable to create Leopard");

        assert_eq!(leopard.sample_rate(), source.sample_rate());
        let result = leopard.process(&source.collect_vec());

        assert_eq!(
            result.unwrap().transcript,
            "Mr quilter is the apostle of the middle classes and we are glad to welcome his gospel"
        )
    }

    #[test]
    fn test_process_punctuation() {
        let access_key = env::var("PV_ACCESS_KEY")
            .expect("Pass the AccessKey in using the PV_ACCESS_KEY env variable");

        let audio_path = format!(
            "{}{}",
            env!("CARGO_MANIFEST_DIR"),
            "/../../resources/audio_samples/test.wav",
        );

        let audio_file = BufReader::new(File::open(&audio_path).expect(&audio_path));
        let source = Decoder::new(audio_file).unwrap();

        let leopard = LeopardBuilder::new()
            .access_key(access_key)
            .enable_automatic_punctuation(true)
            .init()
            .expect("Unable to create Leopard");

        assert_eq!(leopard.sample_rate(), source.sample_rate());
        let result = leopard.process(&source.collect_vec());

        assert_eq!(
            result.unwrap().transcript,
            "Mr. Quilter is the apostle of the middle classes and we are glad to welcome his gospel."
        )
    }

    #[test]
    fn test_process_file() {
        let access_key = env::var("PV_ACCESS_KEY")
            .expect("Pass the AccessKey in using the PV_ACCESS_KEY env variable");

        let audio_path = format!(
            "{}{}",
            env!("CARGO_MANIFEST_DIR"),
            "/../../resources/audio_samples/test.wav",
        );

        let leopard = LeopardBuilder::new()
            .access_key(access_key)
            .init()
            .expect("Unable to create Leopard");
        let result = leopard.process_file(&audio_path);

        assert_eq!(
            result.unwrap().transcript,
            "Mr quilter is the apostle of the middle classes and we are glad to welcome his gospel"
        )
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
