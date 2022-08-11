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
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Bundle;
import android.os.Process;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.ToggleButton;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

import ai.picovoice.leopard.Leopard;
import ai.picovoice.leopard.LeopardActivationException;
import ai.picovoice.leopard.LeopardActivationLimitException;
import ai.picovoice.leopard.LeopardActivationRefusedException;
import ai.picovoice.leopard.LeopardActivationThrottledException;
import ai.picovoice.leopard.LeopardException;
import ai.picovoice.leopard.LeopardInvalidArgumentException;
import ai.picovoice.leopard.LeopardTranscript;

public class MainActivity extends AppCompatActivity {
    private static final String ACCESS_KEY = "${YOUR_ACCESS_KEY_HERE}";
    private static final String MODEL_FILE = "leopard_params.pv";
    private static final int maxRecordingLength = 120;

    private final MicrophoneReader microphoneReader = new MicrophoneReader();
    private final ArrayList<Short> pcmData = new ArrayList<>();

    private Leopard leopard;

    private enum UIState {
        RECORDING,
        TRANSCRIBING,
        RESULTS,
        ERROR
    }

    private void setUIState(UIState state) {
        runOnUiThread(() -> {
            TextView errorText = findViewById(R.id.errorTextView);
            TextView recordingTextView = findViewById(R.id.recordingTextView);
            TextView transcriptTextView = findViewById(R.id.transcriptTextView);
            ToggleButton recordButton = findViewById(R.id.recordButton);
            LinearLayout verboseResultsLayout = findViewById(R.id.verboseResultsLayout);

            switch (state) {
                case RECORDING:
                    errorText.setVisibility(View.INVISIBLE);
                    verboseResultsLayout.setVisibility(View.INVISIBLE);
                    transcriptTextView.setVisibility(View.INVISIBLE);
                    recordingTextView.setText("Recording...");
                    recordButton.setEnabled(true);
                    break;
                case TRANSCRIBING:
                    errorText.setVisibility(View.INVISIBLE);
                    verboseResultsLayout.setVisibility(View.INVISIBLE);
                    transcriptTextView.setVisibility(View.INVISIBLE);
                    recordingTextView.setText("Transcribing audio...");
                    recordButton.setEnabled(false);
                    break;
                case RESULTS:
                    errorText.setVisibility(View.INVISIBLE);
                    verboseResultsLayout.setVisibility(View.VISIBLE);
                    transcriptTextView.setVisibility(View.VISIBLE);
                    recordButton.setEnabled(true);
                    break;
                case ERROR:
                    verboseResultsLayout.setVisibility(View.INVISIBLE);
                    transcriptTextView.setVisibility(View.INVISIBLE);
                    recordButton.setEnabled(false);
                    break;
            }
        });
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.leopard_demo);

        try {
            leopard = new Leopard.Builder()
                    .setAccessKey(ACCESS_KEY)
                    .setModelPath(MODEL_FILE)
                    .setEnableAutomaticPunctuation(true)
                    .build(getApplicationContext());
        } catch (LeopardInvalidArgumentException e) {
            displayError(String.format("%s\nEnsure your AccessKey '%s' is valid", e.getMessage(), ACCESS_KEY));
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
        setUIState(UIState.ERROR);

        TextView errorText = findViewById(R.id.errorTextView);
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);

        ToggleButton recordButton = findViewById(R.id.recordButton);
        recordButton.setEnabled(false);
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
            setUIState(UIState.RECORDING);
            microphoneReader.start();
        }
    }

    @SuppressLint({"SetTextI18n", "DefaultLocale"})
    public void onRecordClick(View view) {
        ToggleButton recordButton = findViewById(R.id.recordButton);

        if (leopard == null) {
            displayError("Leopard is not initialized");
            recordButton.setChecked(false);
            return;
        }

        if (recordButton.isChecked()) {
            if (hasRecordPermission()) {
                setUIState(UIState.RECORDING);
                microphoneReader.start();
            } else {
                requestRecordPermission();
            }
        } else {
            try {
                microphoneReader.stop();
            } catch (InterruptedException e) {
                displayError("Audio stop command interrupted\n" + e);
            }

            setUIState(UIState.TRANSCRIBING);

            new Thread(() -> {
                short[] pcmDataArray = new short[pcmData.size()];
                for (int i = 0; i < pcmData.size(); ++i) {
                    pcmDataArray[i] = pcmData.get(i);
                }

                try {
                    long transcribeStart = System.currentTimeMillis();
                    LeopardTranscript transcript = leopard.process(pcmDataArray);
                    long transcribeEnd = System.currentTimeMillis();

                    float transcribeTime = (transcribeEnd - transcribeStart) / 1000f;

                    runOnUiThread(() -> {
                        setUIState(UIState.RESULTS);

                        TextView transcriptTextView = findViewById(R.id.transcriptTextView);
                        transcriptTextView.setText(transcript.getTranscriptString());

                        TextView recordingTextView = findViewById(R.id.recordingTextView);
                        recordingTextView.setText(String.format(
                                "Transcribed %.1f(s) of audio in %.1f(s).",
                                pcmData.size() / (float)leopard.getSampleRate(),
                                transcribeTime));

                        RecyclerView verboseResultsView = findViewById(R.id.verboseResultsView);
                        LinearLayoutManager linearLayoutManager = new LinearLayoutManager(getApplicationContext());
                        verboseResultsView.setLayoutManager(linearLayoutManager);

                        VerboseResultsViewAdaptor searchResultsViewAdaptor = new VerboseResultsViewAdaptor(
                                getApplicationContext(),
                                Arrays.asList(transcript.getWordArray()));
                        verboseResultsView.setAdapter(searchResultsViewAdaptor);
                    });
                } catch (LeopardException e) {
                    runOnUiThread(() -> displayError("Audio failed\n" + e));
                }
            }).start();
        }
    }

    private static class VerboseResultsViewAdaptor extends RecyclerView.Adapter<VerboseResultsViewAdaptor.ViewHolder> {
        final private List<LeopardTranscript.Word> data;
        final private LayoutInflater inflater;

        VerboseResultsViewAdaptor(Context context, List<LeopardTranscript.Word> data) {
            this.inflater = LayoutInflater.from(context);
            this.data = data;
        }

        @NonNull
        @Override
        public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View view = inflater.inflate(R.layout.recyclerview_row, parent, false);
            return new ViewHolder(view);
        }

        @SuppressLint("DefaultLocale")
        @Override
        public void onBindViewHolder(ViewHolder holder, int position) {
            LeopardTranscript.Word word = data.get(position);
            holder.word.setText(word.getWord());
            holder.startSec.setText(String.format("%.2fs", word.getStartSec()));
            holder.endSec.setText(String.format("%.2fs", word.getEndSec()));
            holder.confidence.setText(String.format("%.0f%%", word.getConfidence() * 100));
        }

        @Override
        public int getItemCount() {
            return data.size();
        }

        public static class ViewHolder extends RecyclerView.ViewHolder {
            TextView word;
            TextView startSec;
            TextView endSec;
            TextView confidence;

            ViewHolder(View itemView) {
                super(itemView);
                word = itemView.findViewById(R.id.word);
                startSec = itemView.findViewById(R.id.startSec);
                endSec = itemView.findViewById(R.id.endSec);
                confidence = itemView.findViewById(R.id.confidence);
            }
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
