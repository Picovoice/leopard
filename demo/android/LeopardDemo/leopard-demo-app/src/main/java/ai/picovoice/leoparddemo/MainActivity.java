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

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.pm.PackageManager;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Bundle;
import android.os.Process;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.ToggleButton;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;

import java.io.File;
import java.util.ArrayList;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

import ai.picovoice.leopard.*;

public class MainActivity extends AppCompatActivity {
    private static final String ACCESS_KEY = "${YOUR_ACCESS_KEY_HERE}";

    public static final int maxRecordingLength = 120;

    private final MicrophoneReader microphoneReader = new MicrophoneReader();
    final private ArrayList<Short> pcmData = new ArrayList<>();
    public Leopard leopard;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.leopard_demo);

        try {
            String modelPath = "leopard_params.pv";
            leopard = new Leopard.Builder(ACCESS_KEY).setModelPath(modelPath).build(getApplicationContext());
        } catch (LeopardInvalidArgumentException e) {
            displayError(String.format("(%s)\n Ensure your AccessKey '%s' is valid", e.getMessage(), ACCESS_KEY));
        } catch (LeopardActivationException e) {
            displayError("AccessKey activation error");
        } catch (LeopardActivationLimitException e) {
            displayError("AccessKey reached its device limit");
        } catch (LeopardActivationRefusedException e) {
            displayError("AccessKey refused");
        } catch (LeopardActivationThrottledException e) {
            displayError("AccessKey has been throttled");
        } catch (LeopardException e) {
            displayError("Failed to initialize Leopard " + e.getMessage());
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        leopard.delete();
    }

    private void displayError(String message) {
        TextView errorText = findViewById(R.id.errorTextView);
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
    }

    private boolean hasRecordPermission() {
        return ActivityCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    private void requestRecordPermission() {
        ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.RECORD_AUDIO}, 0);
    }

    @SuppressLint("SetTextI18n")
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (grantResults.length == 0 || grantResults[0] == PackageManager.PERMISSION_DENIED) {
            ToggleButton toggleButton = findViewById(R.id.recordButton);
            toggleButton.toggle();
        } else {
            TextView recordingTextView = findViewById(R.id.recordingTextView);
            recordingTextView.setText("Recording...");
            microphoneReader.start();
        }
    }

    @SuppressLint({"SetTextI18n", "DefaultLocale"})
    public void onRecordClick(View view) {
        ToggleButton recordButton = findViewById(R.id.recordButton);
        TextView recordingTextView = findViewById(R.id.recordingTextView);
        TextView transcriptTextView = findViewById(R.id.transcriptTextView);

        if (leopard == null) {
            displayError("Leopard is not initialized");
            recordButton.setChecked(false);
            return;
        }

        try {
            if (recordButton.isChecked()) {
                if (hasRecordPermission()) {
                    microphoneReader.start();
                } else {
                    requestRecordPermission();
                }
            } else {
                microphoneReader.stop();
                recordingTextView.setText("Transcribing, please wait...");

                short[] pcmDataArray = new short[pcmData.size()];
                for (int i = 0; i < pcmData.size(); ++i) {
                    pcmDataArray[i] = pcmData.get(i);
                }

                long transcribeStart = System.currentTimeMillis();
                String transcript = leopard.process(pcmDataArray);
                long transcribeEnd = System.currentTimeMillis();

                float transcribeTime = (transcribeEnd - transcribeStart) / 1000f;

                transcriptTextView.setText(transcript);
                recordingTextView.setText(String.format("Transcribed %d(s) of audio in %.1f(s).", pcmData.size() / leopard.getSampleRate(), transcribeTime));
            }
        } catch (InterruptedException e) {
            displayError("Audio stop command interrupted\n" + e.toString());
        } catch (LeopardException e) {
            displayError("Audio failed\n" + e.toString());
        }
    }

    private class MicrophoneReader {
        private final AtomicBoolean started = new AtomicBoolean(false);
        private final AtomicBoolean stop = new AtomicBoolean(false);
        private final AtomicBoolean stopped = new AtomicBoolean(false);

        void start() {
            if (started.get()) {
                return;
            }

            started.set(true);

            Executors.newSingleThreadExecutor().submit((Callable<Void>) () -> {
                Process.setThreadPriority(Process.THREAD_PRIORITY_URGENT_AUDIO);
                read();
                return null;
            });

            Executors.newSingleThreadExecutor().submit((Callable<Void>) () -> {
                Process.setThreadPriority(Process.THREAD_PRIORITY_DEFAULT);
                readCounter();
                return null;
            });
        }

        void stop() throws InterruptedException {
            if (!started.get()) {
                return;
            }

            stop.set(true);

            synchronized (stopped) {
                while (!stopped.get()) {
                    stopped.wait(500);
                }
            }

            started.set(false);
            stop.set(false);
            stopped.set(false);
        }

        @SuppressLint("DefaultLocale")
        private void readCounter() {
            TextView recordingTextView = findViewById(R.id.recordingTextView);

            float readCount = 0;
            while (!stop.get()) {
                recordingTextView.setText(String.format("Recording : %.1f / %d (seconds)", readCount, maxRecordingLength));
                readCount += 0.1;

                if (readCount > maxRecordingLength) {
                    stop.set(true);
                }

                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }

            recordingTextView.invalidate();
        }

        private void read() throws LeopardException {
            final int bufferSize = AudioRecord.getMinBufferSize(
                    leopard.getSampleRate(),
                    AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT);

            AudioRecord audioRecord = null;

            short[] buffer = new short[bufferSize];
            pcmData.clear();

            try {
                audioRecord = new AudioRecord(
                        MediaRecorder.AudioSource.MIC,
                        leopard.getSampleRate(),
                        AudioFormat.CHANNEL_IN_MONO,
                        AudioFormat.ENCODING_PCM_16BIT,
                        bufferSize);
                audioRecord.startRecording();


                while (!stop.get()) {
                    if (audioRecord.read(buffer, 0, buffer.length) == buffer.length) {
                        for (short value : buffer) {
                            pcmData.add(value);
                        }
                    }
                }

                audioRecord.stop();
            } catch (IllegalArgumentException | IllegalStateException | SecurityException e) {
                throw new LeopardException(e);
            } finally {
                if (audioRecord != null) {
                    audioRecord.release();
                }

                stopped.set(true);
                stopped.notifyAll();
            }
        }
    }
}
