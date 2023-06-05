//
// Copyright 2022-2023 Picovoice Inc.
//
// You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
// file accompanying this source.
//
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
// an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.
//

import React, { Component } from 'react';
import {
  EventSubscription,
  NativeEventEmitter,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  Leopard,
  LeopardErrors,
  LeopardWord,
} from '@picovoice/leopard-react-native';
import {
  BufferEmitter,
  VoiceProcessor,
} from '@picovoice/react-native-voice-processor';

import Recorder from './Recorder';

import { language } from '../params.json';

enum UIState {
  LOADING,
  INIT,
  RECORDING,
  PROCESSING,
  TRANSCRIBED,
  ERROR,
}

type Props = {};
type State = {
  appState: UIState;
  errorMessage: string | null;
  transcription: string;
  words: LeopardWord[];
  recordSeconds: number;
  processSeconds: number;
};

export default class App extends Component<Props, State> {
  _leopard?: Leopard;
  _accessKey: string = '${YOUR_ACCESS_KEY_HERE}'; // AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)

  _recorder: Recorder = new Recorder();
  _voiceProcessor?: VoiceProcessor;
  _bufferListener?: EventSubscription;
  _bufferEmitter?: NativeEventEmitter;

  _recordInterval?: NodeJS.Timer;

  constructor(props: Props) {
    super(props);
    this.state = {
      appState: UIState.LOADING,
      errorMessage: null,
      transcription: '',
      words: [],
      recordSeconds: 0.0,
      processSeconds: 0.0,
    };
  }

  componentDidMount() {
    this.init();
  }

  componentWillUnmount() {
    if (this.state.appState === UIState.RECORDING) {
      this._stopProcessing();
    }
    if (this._leopard !== undefined) {
      this._leopard.delete();
      this._leopard = undefined;
    }
  }

  async init() {
    const suffix = language === 'en' ? '' : `_${language}`;

    try {
      this._leopard = await Leopard.create(
        this._accessKey,
        `leopard_params${suffix}.pv`,
        { enableAutomaticPunctuation: true },
      );
      this._voiceProcessor = VoiceProcessor.getVoiceProcessor(
        512,
        this._leopard.sampleRate,
      );
      this._bufferEmitter = new NativeEventEmitter(BufferEmitter);
      this._bufferListener = this._bufferEmitter.addListener(
        BufferEmitter.BUFFER_EMITTER_KEY,
        async (buffer: number[]) => {
          if (this.state.appState !== UIState.ERROR) {
            try {
              await this._recorder.writeSamples(buffer);
            } catch {
              this.handleError('Failed to write to wav file.');
            }
          }
        },
      );
      this.setState({
        appState: UIState.INIT,
      });
    } catch (err: any) {
      this.handleError(err);
    }
  }

  handleError(err: any) {
    let errorMessage = '';
    if (err instanceof LeopardErrors.LeopardInvalidArgumentError) {
      errorMessage = `${err.message}\nPlease make sure accessKey ${this._accessKey} is a valid access key.`;
    } else if (err instanceof LeopardErrors.LeopardActivationError) {
      errorMessage = 'AccessKey activation error';
    } else if (err instanceof LeopardErrors.LeopardActivationLimitError) {
      errorMessage = 'AccessKey reached its device limit';
    } else if (err instanceof LeopardErrors.LeopardActivationRefusedError) {
      errorMessage = 'AccessKey refused';
    } else if (err instanceof LeopardErrors.LeopardActivationThrottledError) {
      errorMessage = 'AccessKey has been throttled';
    } else {
      errorMessage = err.toString();
    }

    this._voiceProcessor?.stop();
    this.setState({
      appState: UIState.ERROR,
      errorMessage: errorMessage,
    });
  }

  _startProcessing() {
    this.setState({
      appState: UIState.RECORDING,
      recordSeconds: 0,
    });

    let recordAudioRequest;
    if (Platform.OS === 'android') {
      recordAudioRequest = this._requestRecordAudioPermission();
    } else {
      recordAudioRequest = new Promise(function (resolve, _) {
        resolve(true);
      });
    }

    recordAudioRequest.then(async (hasPermission) => {
      if (!hasPermission) {
        this.handleError(
          'Required permissions (Microphone) were not found. Please add to platform code.',
        );
        return;
      }

      try {
        await this._recorder.resetFile();
        await this._recorder.writeWavHeader();
        await this._voiceProcessor?.start();

        this._recordInterval = setInterval(() => {
          if (this.state.recordSeconds < 120 - 0.1) {
            this.setState({
              recordSeconds: this.state.recordSeconds + 0.1,
            });
          } else {
            this._stopProcessing();
          }
        }, 100);
      } catch (err: any) {
        this.handleError(err);
      }
    });
  }

  _stopProcessing() {
    this.setState({
      appState: UIState.PROCESSING,
    });
    clearInterval(this._recordInterval!);

    this._voiceProcessor?.stop().then(async () => {
      try {
        const audioPath = await this._recorder.finalize();
        const start = Date.now();
        const { transcript, words } = await this._leopard!.processFile(
          audioPath,
        );
        const end = Date.now();
        this.setState({
          transcription: transcript,
          words: words,
          appState: UIState.TRANSCRIBED,
          processSeconds: (end - start) / 1000,
        });
      } catch (err: any) {
        this.handleError(err);
      }
    });
  }

  _toggleListening() {
    if (this.state.appState === UIState.RECORDING) {
      this._stopProcessing();
    } else if (
      this.state.appState === UIState.INIT ||
      this.state.appState === UIState.TRANSCRIBED
    ) {
      this._startProcessing();
    }
  }

  async _requestRecordAudioPermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'Leopard needs access to your microphone to record audio',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err: any) {
      this.handleError(err);
      return false;
    }
  }

  _generateTableRow(word: LeopardWord, index: number) {
    return (
      <View key={`word-${index}`} style={styles.wordTableRow}>
        <Text style={styles.wordText}>{word.word}</Text>
        <Text style={styles.wordText}>{`${word.startSec.toFixed(2)}s`}</Text>
        <Text style={styles.wordText}>{`${word.endSec.toFixed(2)}s`}</Text>
        <Text style={styles.wordText}>{`${(word.confidence * 100).toFixed(
          0,
        )}%`}</Text>
      </View>
    );
  }

  render() {
    const disabled =
      this.state.appState === UIState.LOADING ||
      this.state.appState === UIState.ERROR ||
      this.state.appState === UIState.PROCESSING;

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#377DFF" />
        <View style={styles.statusBar}>
          <Text style={styles.statusBarText}>Leopard</Text>
        </View>

        <View style={{ flex: 4 }}>
          {this.state.appState === UIState.TRANSCRIBED && (
            <ScrollView style={styles.transcriptionBox}>
              <Text style={styles.transcriptionText}>
                {this.state.transcription}
              </Text>
            </ScrollView>
          )}
        </View>

        <View style={{ flex: 2 }}>
          {this.state.appState === UIState.TRANSCRIBED && (
            <>
              <View style={styles.wordTableHeader}>
                <Text style={styles.wordCell}>Word</Text>
                <Text style={styles.wordCell}>Start</Text>
                <Text style={styles.wordCell}>End</Text>
                <Text style={styles.wordCell}>Confidence</Text>
              </View>
              <ScrollView style={styles.wordBox}>
                {this.state.words.map((word: LeopardWord, index: number) =>
                  this._generateTableRow(word, index),
                )}
              </ScrollView>
            </>
          )}
        </View>

        {this.state.appState === UIState.ERROR ? (
          <View style={styles.errorBox}>
            <Text
              style={{
                color: 'white',
                fontSize: 16,
              }}>
              {this.state.errorMessage}
            </Text>
          </View>
        ) : (
          <View style={styles.stateContainer}>
            {this.state.appState === UIState.INIT && (
              <Text style={{ textAlign: 'center' }}>
                Record up to 2 minutes of audio to be transcribed by Leopard
              </Text>
            )}

            {this.state.appState === UIState.RECORDING && (
              <Text>
                Recording: {this.state.recordSeconds.toFixed(1)} / 120 (seconds)
              </Text>
            )}

            {this.state.appState === UIState.PROCESSING && (
              <Text>Processing audio...</Text>
            )}

            {this.state.appState === UIState.TRANSCRIBED && (
              <Text>
                Transcribed {this.state.recordSeconds.toFixed(1)} seconds of
                audio in {this.state.processSeconds.toFixed(1)} seconds
              </Text>
            )}
          </View>
        )}

        <View
          style={{ flex: 1, justifyContent: 'center', alignContent: 'center' }}>
          <TouchableOpacity
            style={[styles.buttonStyle, disabled ? styles.buttonDisabled : {}]}
            onPress={() => this._toggleListening()}
            disabled={disabled}>
            <Text style={styles.buttonText}>
              {this.state.appState === UIState.RECORDING ? 'Stop' : 'Start'}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{ flex: 0.5, justifyContent: 'flex-end', paddingBottom: 10 }}>
          <Text style={styles.instructions}>
            Made in Vancouver, Canada by Picovoice
          </Text>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: '#F5FCFF',
  },
  subContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statusBar: {
    flex: 1,
    backgroundColor: '#377DFF',
    justifyContent: 'flex-end',
    maxHeight: 50,
  },
  statusBarText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 15,
    marginBottom: 15,
  },
  buttonStyle: {
    width: '50%',
    height: 60,
    alignSelf: 'center',
    justifyContent: 'center',
    backgroundColor: '#377DFF',
    borderRadius: 100,
  },
  buttonText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'gray',
  },
  itemStyle: {
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
  },
  instructions: {
    textAlign: 'center',
    color: '#666666',
  },
  errorBox: {
    backgroundColor: 'red',
    margin: 20,
    padding: 20,
    textAlign: 'center',
  },
  stateContainer: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  transcriptionBox: {
    backgroundColor: '#25187E',
    margin: 20,
    marginBottom: 10,
    padding: 20,
    height: '100%',
  },
  transcriptionText: {
    fontSize: 20,
    color: 'white',
  },
  wordBox: {
    backgroundColor: '#25187E',
    marginHorizontal: 20,
    marginVertical: 10,
    height: '100%',
  },
  wordTableHeader: {
    flexDirection: 'row',
    marginHorizontal: 25,
    marginTop: 10,
  },
  wordTableRow: {
    flexDirection: 'row',
    margin: 2,
  },
  wordText: {
    fontSize: 12,
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  wordCell: {
    flex: 1,
    textAlign: 'center',
  },
});
