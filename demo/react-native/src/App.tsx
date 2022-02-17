//
// Copyright 2022 Picovoice Inc.
//
// You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
// file accompanying this source.
//
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
// an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.
//

import React, {Component} from 'react';
import {PermissionsAndroid, Platform, TouchableOpacity} from 'react-native';
import {StyleSheet, Text, View} from 'react-native';
import {Leopard, LeopardErrors} from '@picovoice/leopard-react-native';

type Props = {};
type State = {
  buttonText: string;
  buttonDisabled: boolean;
  isListening: boolean;
  backgroundColour: string;
  isError: boolean;
  errorMessage: string | null;
};

export default class App extends Component<Props, State> {
  _leopard: Leopard | undefined;
  _detectionColour: string = '#00E5C3';
  _defaultColour: string = '#F5FCFF';
  _accessKey: string = '${YOUR_ACCESS_KEY_HERE}'; // AccessKey obtained from Picovoice Console (https://picovoice.ai/console/)

  constructor(props: Props) {
    super(props);
    this.state = {
      buttonText: 'Start',
      buttonDisabled: false,
      isListening: false,
      backgroundColour: this._defaultColour,
      isError: false,
      errorMessage: null,
    };
  }

  async componentDidMount() {
    try {
      this._leopard = await Leopard.create(this._accessKey);
    } catch (err: any) {
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

      this.setState({
        isError: true,
        errorMessage: errorMessage,
      });
    }
  }

  componentWillUnmount() {
    if (this.state.isListening) {
      this._stopProcessing();
    }
  }

  async _startProcessing() {
    this.setState({
      buttonDisabled: true,
    });

    let recordAudioRequest;
    if (Platform.OS === 'android') {
      recordAudioRequest = this._requestRecordAudioPermission();
    } else {
      recordAudioRequest = new Promise(function (resolve, _) {
        resolve(true);
      });
    }

    recordAudioRequest.then((hasPermission) => {
      if (!hasPermission) {
        console.error(
          "Required permissions (Microphone) we're not found. Please add to platform code.",
        );
        this.setState({
          buttonDisabled: false,
        });
        return;
      }
    });
  }

  _stopProcessing() {
    this.setState({
      buttonDisabled: true,
    });
  }

  _toggleListening() {
    if (this.state.isListening) {
      this._stopProcessing();
    } else {
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
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err: any) {
      this.setState({
        isError: true,
        errorMessage: err.toString(),
      });
      return false;
    }
  }

  render() {
    return (
      <View
        style={[
          styles.container,
          {backgroundColor: this.state.backgroundColour},
        ]}>
        <View style={styles.statusBar}>
          <Text style={styles.statusBarText}>Porcupine</Text>
        </View>
        <View style={{flex: 1, paddingTop: '10%'}}>
          <Text style={{color: '#666666', marginLeft: 15, marginBottom: 5}}>
            Keyword
          </Text>
          <View
            style={{
              width: '90%',
              height: '40%',
              alignContent: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
            }}
          />
        </View>

        <View
          style={{flex: 1, justifyContent: 'center', alignContent: 'center'}}>
          <TouchableOpacity
            style={{
              width: '50%',
              height: '50%',
              alignSelf: 'center',
              justifyContent: 'center',
              backgroundColor: '#377DFF',
              borderRadius: 100,
            }}
            onPress={() => this._toggleListening()}
            disabled={this.state.buttonDisabled || this.state.isError}>
            <Text style={styles.buttonText}>{this.state.buttonText}</Text>
          </TouchableOpacity>
        </View>
        {this.state.isError && (
          <View style={styles.errorBox}>
            <Text
              style={{
                color: 'white',
                fontSize: 16,
              }}>
              {this.state.errorMessage}
            </Text>
          </View>
        )}
        <View style={{flex: 1, justifyContent: 'flex-end', paddingBottom: 25}}>
          <Text style={styles.instructions}>
            Made in Vancouver, Canada by Picovoice
          </Text>
        </View>
      </View>
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
    flex: 0.4,
    backgroundColor: '#377DFF',
    justifyContent: 'flex-end',
  },
  statusBarText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 15,
    marginBottom: 15,
  },
  buttonStyle: {
    backgroundColor: '#377DFF',
    borderRadius: 100,
  },
  buttonText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
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
    borderRadius: 5,
    margin: 20,
    padding: 20,
    textAlign: 'center',
  },
});
