/*
    Copyright 2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is
    located in the "LICENSE" file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the
    License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
    express or implied. See the License for the specific language governing permissions and
    limitations under the License.
*/

package ai.picovoice.leoparddemo;

import ai.picovoice.leopard.Leopard;
import ai.picovoice.leopard.LeopardTranscript;
import org.apache.commons.cli.*;

import javax.sound.sampled.*;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

class Recorder extends Thread {
    private TargetDataLine micDataLine = null;
    private boolean stop = false;
    private boolean isRecording = false;
    private List pcmBuffer = null;

    public Recorder(int audioDeviceIndex) {
        AudioFormat format = new AudioFormat(16000f, 16, 1, true, false);
        DataLine.Info dataLineInfo = new DataLine.Info(TargetDataLine.class, format);
        TargetDataLine micDataLine;
        try {
            micDataLine = getAudioDevice(audioDeviceIndex, dataLineInfo);
            micDataLine.open(format);
        } catch (LineUnavailableException e) {
            System.err.println("Failed to get a valid capture device. Use --show_audio_devices to " +
                    "show available capture devices and their indices");
            System.exit(1);
            return;
        }

        this.micDataLine = micDataLine;
        this.stop = false;
        this.isRecording = false;
        this.pcmBuffer = new ArrayList();
    }

    private static TargetDataLine getDefaultCaptureDevice(DataLine.Info dataLineInfo) throws LineUnavailableException {
        if (!AudioSystem.isLineSupported(dataLineInfo)) {
            throw new LineUnavailableException("Default capture device does not support the audio " +
                    "format required by Picovoice (16kHz, 16-bit, linearly-encoded, single-channel PCM).");
        }

        return (TargetDataLine) AudioSystem.getLine(dataLineInfo);
    }

    private static TargetDataLine getAudioDevice(
            int deviceIndex,
            DataLine.Info dataLineInfo) throws LineUnavailableException {
        if (deviceIndex >= 0) {
            try {
                Mixer.Info mixerInfo = AudioSystem.getMixerInfo()[deviceIndex];
                Mixer mixer = AudioSystem.getMixer(mixerInfo);

                if (mixer.isLineSupported(dataLineInfo)) {
                    return (TargetDataLine) mixer.getLine(dataLineInfo);
                } else {
                    System.err.printf(
                            "Audio capture device at index %s does not support the audio format required by " +
                                    "Picovoice. Using default capture device.", deviceIndex);
                }
            } catch (Exception e) {
                System.err.printf("No capture device found at index %s. Using default capture device.", deviceIndex);
            }
        }

        // use default capture device if we couldn't get the one requested
        return getDefaultCaptureDevice(dataLineInfo);
    }

    public void run() {
        this.isRecording = true;
        micDataLine.start();

        ByteBuffer captureBuffer = ByteBuffer.allocate(512);
        captureBuffer.order(ByteOrder.LITTLE_ENDIAN);
        short[] shortBuffer = new short[256];

        while (!stop) {
            micDataLine.read(captureBuffer.array(), 0, captureBuffer.capacity());
            captureBuffer.asShortBuffer().get(shortBuffer);
            for (int i = 0; i < shortBuffer.length; ++i) {
                this.pcmBuffer.add(shortBuffer[i]);
            }
        }
    }

    public void end() {
        this.stop = true;
    }

    public short[] getPCM() {
        short[] pcm = new short[this.pcmBuffer.size()];
        for (int i = 0; i < this.pcmBuffer.size(); ++i) {
            pcm[i] = (short) this.pcmBuffer.get(i);
        }
        return pcm;
    }
}

public class MicDemo {
    public static void runDemo(
            String accessKey,
            String modelPath,
            String libraryPath,
            boolean enableAutomaticPunctuation,
            boolean verbose,
            int audioDeviceIndex) {
        Leopard leopard = null;
        try {
            leopard = new Leopard.Builder()
                    .setAccessKey(accessKey)
                    .setModelPath(modelPath)
                    .setLibraryPath(libraryPath)
                    .setEnableAutomaticPunctuation(enableAutomaticPunctuation)
                    .build();

            System.out.println("Leopard version : " + leopard.getVersion());
            System.out.println(">>> Press `CTRL+C` to exit:");

            Recorder recorder = null;
            Scanner scanner = new Scanner(System.in);

            while (System.in.available() == 0) {
                if (recorder != null) {
                    System.out.println(">>> Recording ... Press 'ENTER' to stop:");
                    scanner.nextLine();
                    recorder.end();
                    while (recorder.isAlive()) {
                    }
                    short[] pcm = recorder.getPCM();

                    LeopardTranscript transcript = leopard.process(pcm);
                    System.out.println(transcript.getTranscriptString() + "\n");
                    if (verbose) {
                        LeopardTranscript.Word[] words = transcript.getWordArray();
                        System.out.format("%14s - %5s - %5s - %5s\n", "word", "start", "end", "confidence");
                        for (int i = 0; i < words.length; i++) {
                            System.out.format(
                                    "%2d: %10s - %5.2f - %5.2f - %5.2f\n",
                                    i,
                                    words[i].getWord(),
                                    words[i].getStartSec(),
                                    words[i].getEndSec(),
                                    words[i].getConfidence());
                        }
                    }
                    recorder = null;
                } else {
                    System.out.println(">>> Press 'ENTER' to start:");
                    scanner.nextLine();
                    recorder = new Recorder(audioDeviceIndex);
                    recorder.start();
                }
            }

            System.out.println("Stopping...");
        } catch (Exception e) {
            System.err.println(e.toString());
        } finally {
            if (leopard != null) {
                leopard.delete();
            }
        }
    }

    private static void showAudioDevices() {
        // get available audio devices
        Mixer.Info[] allMixerInfo = AudioSystem.getMixerInfo();
        Line.Info captureLine = new Line.Info(TargetDataLine.class);

        for (int i = 0; i < allMixerInfo.length; i++) {

            // check if supports capture in the format we need
            Mixer mixer = AudioSystem.getMixer(allMixerInfo[i]);
            if (mixer.isLineSupported(captureLine)) {
                System.out.printf("Device %d: %s\n", i, allMixerInfo[i].getName());
            }
        }
    }

    public static void main(String[] args) {
        Options options = buildCommandLineOptions();
        CommandLineParser parser = new DefaultParser();
        HelpFormatter formatter = new HelpFormatter();

        CommandLine cmd;
        try {
            cmd = parser.parse(options, args);
        } catch (ParseException e) {
            System.out.println(e.getMessage());
            formatter.printHelp("leopardmicdemo", options);
            System.exit(1);
            return;
        }

        if (cmd.hasOption("help")) {
            formatter.printHelp("leopardmicdemo", options);
            return;
        }

        if (cmd.hasOption("show_audio_devices")) {
            showAudioDevices();
            return;
        }

        String accessKey = cmd.getOptionValue("access_key");
        String modelPath = cmd.getOptionValue("model_path");
        String libraryPath = cmd.getOptionValue("library_path");
        boolean enableAutomaticPunctuation = !cmd.hasOption("disable_automatic_punctuation");
        boolean verbose = cmd.hasOption("verbose");
        String audioDeviceIndexStr = cmd.getOptionValue("audio_device_index");

        if (accessKey == null || accessKey.length() == 0) {
            throw new IllegalArgumentException("AccessKey is required for Leopard.");
        }

        if (libraryPath == null) {
            libraryPath = Leopard.LIBRARY_PATH;
        }

        if (modelPath == null) {
            modelPath = Leopard.MODEL_PATH;
        }

        int audioDeviceIndex = -1;
        if (audioDeviceIndexStr != null) {
            try {
                audioDeviceIndex = Integer.parseInt(audioDeviceIndexStr);
                if (audioDeviceIndex < 0) {
                    throw new IllegalArgumentException(String.format("Audio device index %s is not a " +
                            "valid positive integer.", audioDeviceIndexStr));
                }
            } catch (Exception e) {
                throw new IllegalArgumentException(String.format("Audio device index '%s' is not a " +
                        "valid positive integer.", audioDeviceIndexStr));
            }
        }

        runDemo(
                accessKey,
                modelPath,
                libraryPath,
                enableAutomaticPunctuation,
                verbose,
                audioDeviceIndex);
    }

    private static Options buildCommandLineOptions() {
        Options options = new Options();

        options.addOption(Option.builder("a")
                .longOpt("access_key")
                .hasArg(true)
                .desc("AccessKey obtained from Picovoice Console (https://console.picovoice.ai/).")
                .build());

        options.addOption(Option.builder("m")
                .longOpt("model_path")
                .hasArg(true)
                .desc("Absolute path to the file containing model parameters.")
                .build());

        options.addOption(Option.builder("l")
                .longOpt("library_path")
                .hasArg(true)
                .desc("Absolute path to the Leopard native runtime library.")
                .build());

        options.addOption(Option.builder("d")
                .longOpt("disable_automatic_punctuation")
                .desc("Disable automatic punctuation.")
                .build());

        options.addOption(Option.builder("di")
                .longOpt("audio_device_index")
                .hasArg(true)
                .desc("Index of input audio device.")
                .build());

        options.addOption(Option.builder("v")
                .longOpt("verbose")
                .desc("Enable verbose logging.")
                .build());

        options.addOption(new Option("sd", "show_audio_devices", false, "Print available recording devices."));
        options.addOption(new Option("h", "help", false, ""));

        return options;
    }
}
