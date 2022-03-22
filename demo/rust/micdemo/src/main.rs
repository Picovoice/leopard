/*
    Copyright 2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
*/

use std::io::stdout;
use std::io::Write;
use std::sync::atomic::{AtomicBool, Ordering};
use std::{io, process, thread};

use clap::{App, Arg, ArgGroup};
use ctrlc;
use leopard::LeopardBuilder;
use pv_recorder::RecorderBuilder;

static RECORDING: AtomicBool = AtomicBool::new(false);

fn leopard_demo(audio_device_index: i32, access_key: &str, model_path: Option<&str>) {
    let mut leopard_builder = LeopardBuilder::new(access_key);

    if let Some(model_path) = model_path {
        leopard_builder.model_path(model_path);
    }

    let leopard = leopard_builder.init().expect("Failed to create Leopard");

    let recorder = RecorderBuilder::new()
        .device_index(audio_device_index)
        .frame_length(512)
        .init()
        .expect("Failed to initialize pvrecorder");

    ctrlc::set_handler(|| {
        println!();
        process::exit(0);
    })
    .expect("Unable to setup signal handler");

    println!(">>> Press 'CTRL-C' to exit:");

    let mut input = String::new();
    loop {
        let mut audio_data = Vec::new();

        print!(">>> Press 'Enter' to start: ");
        stdout().flush().expect("Failed to flush");
        io::stdin()
            .read_line(&mut input)
            .expect("Failed to read input");
        RECORDING.store(true, Ordering::SeqCst);

        let leopard = leopard.clone();
        let recorder = recorder.clone();

        let transcript_handle = thread::spawn(move || {
            recorder.start().expect("Failed to start audio recording");
            while RECORDING.load(Ordering::SeqCst) {
                let mut pcm = vec![0; recorder.frame_length()];
                recorder.read(&mut pcm).expect("Failed to read audio frame");
                audio_data.extend_from_slice(&pcm);
            }
            recorder.stop().expect("Failed to stop audio recording");
            let transcript = leopard.process(&audio_data).unwrap();

            transcript
        });

        print!(">>> Recording ... Press 'Enter' to stop: ");
        stdout().flush().expect("Failed to flush");
        io::stdin()
            .read_line(&mut input)
            .expect("Failed to read input");
        RECORDING.store(false, Ordering::SeqCst);

        let transcript = transcript_handle.join().unwrap();
        println!("{}\n", transcript);
    }
}

fn show_audio_devices() {
    let audio_devices = RecorderBuilder::new()
        .init()
        .expect("Failed to initialize pvrecorder")
        .get_audio_devices();
    match audio_devices {
        Ok(audio_devices) => {
            for (idx, device) in audio_devices.iter().enumerate() {
                println!("index: {}, device name: {:?}", idx, device);
            }
        }
        Err(err) => panic!("Failed to get audio devices: {}", err),
    };
}

fn main() {
    let matches = App::new("Picovoice Leopard Rust Mic Demo")
        .group(
            ArgGroup::with_name("actions_group")
                .arg("access_key")
                .arg("show_audio_devices")
                .required(true)
                .multiple(true),
        )
        .arg(
            Arg::with_name("access_key")
                .long("access_key")
                .value_name("ACCESS_KEY")
                .help("AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)")
                .takes_value(true),
        )
        .arg(
            Arg::with_name("model_path")
                .long("model_path")
                .value_name("PATH")
                .help("Path to the file containing model parameter.")
                .takes_value(true),
        )
        .arg(
            Arg::with_name("audio_device_index")
                .long("audio_device_index")
                .value_name("INDEX")
                .help("Index of input audio device.")
                .takes_value(true)
                .default_value("-1"),
        )
        .arg(Arg::with_name("show_audio_devices").long("show_audio_devices"))
        .get_matches();

    if matches.is_present("show_audio_devices") {
        return show_audio_devices();
    }

    let audio_device_index = matches
        .value_of("audio_device_index")
        .unwrap()
        .parse()
        .unwrap();

    let model_path = matches.value_of("model_path");

    let access_key = matches
        .value_of("access_key")
        .expect("AccessKey is REQUIRED for Leopard operation");

    leopard_demo(audio_device_index, access_key, model_path);
}
