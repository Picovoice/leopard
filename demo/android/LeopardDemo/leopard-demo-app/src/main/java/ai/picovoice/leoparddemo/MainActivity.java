/*
    Copyright 2022-2023 Picovoice Inc.

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
import android.os.Bundle;
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
import java.util.Objects;
import java.util.Timer;
import java.util.TimerTask;

import ai.picovoice.android.voiceprocessor.VoiceProcessor;
import ai.picovoice.android.voiceprocessor.VoiceProcessorException;
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
    private static final int MAX_RECORDING_SEC = 120;
    private static final int FRAME_LENGTH = 512;

    private final VoiceProcessor voiceProcessor = VoiceProcessor.getInstance();
    private final ArrayList<Short> pcmData = new ArrayList<>();

    private Timer recordingTimer;
    private double recordingTimeSec = 0;

    private Leopard leopard;

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
                default:
                    break;
            }
        });
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.leopard_demo);

        try {
            Leopard.Builder builder = new Leopard.Builder()
                    .setAccessKey(ACCESS_KEY)
                    .setEnableAutomaticPunctuation(true);

            String model;
            if (Objects.equals(BuildConfig.FLAVOR, "en")) {
                model = "leopard_params.pv";
            } else {
                model = "leopard_params_" + BuildConfig.FLAVOR + ".pv";
            }
            builder.setModelPath("models/" + model);

            leopard = builder.build(getApplicationContext());
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

        voiceProcessor.addFrameListener(frame -> {
            for (short sample : frame) {
                pcmData.add(sample);
            }
        });

        voiceProcessor.addErrorListener(error -> {
            runOnUiThread(() -> displayError(error.toString()));
        });
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

    private void requestRecordPermission() {
        ActivityCompat.requestPermissions(
                this,
                new String[]{Manifest.permission.RECORD_AUDIO}, 0);
    }

    private void startRecording() {
        setUIState(UIState.RECORDING);

        pcmData.clear();
        try {
            voiceProcessor.start(FRAME_LENGTH, leopard.getSampleRate());
        } catch (VoiceProcessorException e) {
            displayError(e.toString());
            return;
        }

        recordingTimeSec = 0;
        TextView timerValue = findViewById(R.id.recordingTextView);
        recordingTimer = new Timer();
        recordingTimer.scheduleAtFixedRate(new TimerTask() {
            @SuppressLint("DefaultLocale")
            @Override
            public void run() {
                recordingTimeSec += 0.1;
                runOnUiThread(() -> {
                    timerValue.setText(String.format(
                            "Recording : %.1f / %d (seconds)",
                            recordingTimeSec,
                            MAX_RECORDING_SEC));
                    if (recordingTimeSec >= MAX_RECORDING_SEC) {
                        ToggleButton recordButton = findViewById(R.id.recordButton);
                        recordButton.setChecked(false);
                        stopRecording();
                    }
                });
            }
        }, 100, 100);
    }

    @SuppressLint("DefaultLocale")
    private void stopRecording() {
        if (recordingTimer != null) {
            recordingTimer.cancel();
            recordingTimer = null;
        }

        try {
            voiceProcessor.stop();
        } catch (VoiceProcessorException e) {
            displayError(e.toString());
        }

        setUIState(UIState.TRANSCRIBING);
        short[] pcmDataArray = new short[pcmData.size()];
        for (int i = 0; i < pcmData.size(); i++) {
            pcmDataArray[i] = pcmData.get(i);
        }

        new Thread(() -> {
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
                            pcmDataArray.length / (float) leopard.getSampleRate(),
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
                runOnUiThread(() -> displayError("Transcription failed\n" + e));
            }
        }).start();
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode,
            @NonNull String[] permissions,
            @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (grantResults.length == 0 || grantResults[0] == PackageManager.PERMISSION_DENIED) {
            ToggleButton recordButton = findViewById(R.id.recordButton);
            recordButton.setChecked(false);
            displayError("Microphone permission is required for this demo");
        } else {
            startRecording();
        }
    }

    public void onRecordClick(View view) {
        ToggleButton recordButton = findViewById(R.id.recordButton);

        if (leopard == null) {
            displayError("Leopard is not initialized");
            recordButton.setChecked(false);
            return;
        }

        if (recordButton.isChecked()) {
            if (voiceProcessor.hasRecordAudioPermission(this)) {
                startRecording();
            } else {
                requestRecordPermission();
            }
        } else {
            stopRecording();
        }
    }

    private enum UIState {
        RECORDING,
        TRANSCRIBING,
        RESULTS,
        ERROR
    }

    private static class VerboseResultsViewAdaptor extends RecyclerView.Adapter<VerboseResultsViewAdaptor.ViewHolder> {
        private final List<LeopardTranscript.Word> data;
        private final LayoutInflater inflater;

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
}
