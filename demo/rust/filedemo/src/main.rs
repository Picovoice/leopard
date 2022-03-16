/*
    Copyright 2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
*/

use std::path::PathBuf;

use clap::{App, Arg};
use leopard::LeopardBuilder;

fn leopard_demo(
    input_audio_path: PathBuf,
    access_key: &str,
    model_path: Option<&str>,
) {
    let mut leopard_builder = LeopardBuilder::new(access_key);

    if let Some(model_path) = model_path {
        leopard_builder.model_path(model_path);
    }

    let leopard = leopard_builder
        .init()
        .expect("Failed to create Leopard");

    let transcript = leopard.process_file(input_audio_path).unwrap();
    println!("{}", transcript);
}

fn main() {
    let matches = App::new("Picovoice Leopard Rust File Demo")
        .arg(
            Arg::with_name("input_audio_path")
            .long("input_audio_path")
            .value_name("PATH")
            .help("Path to input audio file (mono, WAV, 16-bit, 16kHz).")
            .takes_value(true)
            .required(true)
        )
        .arg(
            Arg::with_name("access_key")
                .long("access_key")
                .value_name("ACCESS_KEY")
                .help("AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)")
                .takes_value(true)
                .required(true),
        )
        .arg(
            Arg::with_name("model_path")
            .long("model_path")
            .value_name("PATH")
            .help("Path to the file containing model parameter.")
            .takes_value(true)
        )
        .get_matches();

    let input_audio_path = PathBuf::from(matches.value_of("input_audio_path").unwrap());

    let model_path = matches.value_of("model_path");

    let access_key = matches
        .value_of("access_key")
        .expect("AccessKey is REQUIRED for Leopard operation");

    leopard_demo(
        input_audio_path,
        access_key,
        model_path,
    );
}
