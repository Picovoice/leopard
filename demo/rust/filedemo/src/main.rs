/*
    Copyright 2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
*/

use std::io::Write;
use std::path::PathBuf;

use clap::{App, Arg};
use leopard::LeopardBuilder;
use tabwriter::TabWriter;

fn leopard_demo(
    input_audio_path: PathBuf,
    access_key: &str,
    model_path: Option<&str>,
    enable_automatic_punctuation: bool,
    verbose: bool,
) {
    let mut leopard_builder = LeopardBuilder::new();

    if let Some(model_path) = model_path {
        leopard_builder.model_path(model_path);
    }

    let leopard = leopard_builder
        .enable_automatic_punctuation(enable_automatic_punctuation)
        .access_key(access_key)
        .init()
        .expect("Failed to create Leopard");

    let leopard_transcript = leopard.process_file(input_audio_path).unwrap();
    println!("{}", leopard_transcript.transcript);
    if verbose {
        println!();
        let mut tw = TabWriter::new(vec![]);
        writeln!(&mut tw, "Word\tStart Sec\tEnd Sec\tConfidence").unwrap();
        writeln!(&mut tw, "----\t---------\t-------\t----------").unwrap();
        leopard_transcript.words.iter().for_each(|word| {
            writeln!(
                &mut tw,
                "{}\t{:.2}\t{:.2}\t{:.2}",
                word.word, word.start_sec, word.end_sec, word.confidence
            )
            .unwrap();
        });
        tw.flush().unwrap();
        println!("{}", String::from_utf8(tw.into_inner().unwrap()).unwrap());
    }
}

fn main() {
    let matches = App::new("Picovoice Leopard Rust File Demo")
        .arg(
            Arg::with_name("input_audio_path")
                .long("input_audio_path")
                .short('i')
                .value_name("PATH")
                .help("Path to input audio file (mono, WAV, 16-bit, 16kHz).")
                .takes_value(true)
                .required(true),
        )
        .arg(
            Arg::with_name("access_key")
                .long("access_key")
                .short('a')
                .value_name("ACCESS_KEY")
                .help("AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)")
                .takes_value(true)
                .required(true),
        )
        .arg(
            Arg::with_name("model_path")
                .long("model_path")
                .short('m')
                .value_name("PATH")
                .help("Path to the file containing model parameter.")
                .takes_value(true),
        )
        .arg(
            Arg::with_name("disable_automatic_punctuation")
                .long("disable_automatic_punctuation")
                .short('d')
                .help("Set to disable automatic punctuation insertion."),
        )
        .arg(
            Arg::with_name("verbose")
                .long("verbose")
                .short('v')
                .help("Set to enable printing of word metadata."),
        )
        .get_matches();

    let input_audio_path = PathBuf::from(matches.value_of("input_audio_path").unwrap());

    let access_key = matches
        .value_of("access_key")
        .expect("AccessKey is REQUIRED for Leopard operation");

    let model_path = matches.value_of("model_path");

    let enable_automatic_punctuation = !matches.contains_id("disable_automatic_punctuation");

    let verbose = matches.contains_id("verbose");

    leopard_demo(
        input_audio_path,
        access_key,
        model_path,
        enable_automatic_punctuation,
        verbose,
    );
}
