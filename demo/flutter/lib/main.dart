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

import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_voice_processor/flutter_voice_processor.dart';
import 'package:leopard_flutter/leopard.dart';
import 'package:leopard_flutter/leopard_error.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final String accessKey = '{YOUR_ACCESS_KEY_HERE}'; // AccessKey obtained from Picovoice Console (https://picovoice.ai/console/)
  final int maxRecordingLengthSecs = 12;
  final int maxRecordingLengthSecs = 120;

  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  bool isError = false;
  String errorMessage = "";

  bool isRecording = false;
  bool isProcessing = false;
  String statusAreaText = "";
  String transcriptText = "";

  MicRecorder? _micRecorder;
  Leopard? _leopard;

  @override
  void initState() {
    super.initState();
    setState(() {
      statusAreaText = "Press START to start recording some audio to transcribe";
      transcriptText = "";
    });

    initLeopard();
  }

  Future<void> initLeopard() async {
    String platform = Platform.isAndroid
        ? "android"
        : Platform.isIOS
            ? "ios"
            : throw LeopardRuntimeException(
                "This demo supports iOS and Android only.");
    String modelPath = "assets/contexts/$platform/leopard_params.pv";

    try {
      _leopard = await Leopard.create(accessKey, modelPath);
      _micRecorder = await MicRecorder.create(_leopard!.sampleRate, recordedCallback, errorCallback);
    } on LeopardInvalidArgumentException catch (ex) {
      errorCallback(LeopardInvalidArgumentException(
          "${ex.message}\nEnsure your accessKey '$accessKey' is a valid access key."));
    } on LeopardActivationException {
      errorCallback(LeopardActivationException("AccessKey activation error."));
    } on LeopardActivationLimitException {
      errorCallback(
          LeopardActivationLimitException("AccessKey reached its device limit."));
    } on LeopardActivationRefusedException {
      errorCallback(LeopardActivationRefusedException("AccessKey refused."));
    } on LeopardActivationThrottledException {
      errorCallback(
          LeopardActivationThrottledException("AccessKey has been throttled."));
    } on LeopardException catch (ex) {
      errorCallback(ex);
    }
  }

  Future<void> recordedCallback(double length) async {

    if (length < maxRecordingLengthSecs) {
      setState(() {
        statusAreaText = "Recording : ${length.toStringAsFixed(1)} / ${maxRecordingLengthSecs} seconds";
      });
    } else {
      setState(() {
        statusAreaText = "Transcribing, please wait...";
      });
      await _stopRecording();
    }
  }

  void errorCallback(LeopardException error) {
    setState(() {
      isError = true;
      errorMessage = error.message!;
    });
  }

  Future<void> _startRecording() async {
    if (isRecording || _micRecorder == null) {
      return;
    }

    try {
      await _micRecorder!.startRecord();
      setState(() {
        isRecording = true;
      });
    } on LeopardException catch (ex) {
      print("Failed to start audio capture: ${ex.message}");
    }
  }

  Future<void> _stopRecording() async {
    if (!isRecording || _micRecorder == null) {
      return;
    }

    try {
      List<int> pcmData = await _micRecorder!.stopRecord();
      setState(() {
        statusAreaText = "Transcribing, please wait...";
        isRecording = false;
      });
      _processAudio(pcmData);
    } on LeopardException catch (ex) {
      print("Failed to stop audio capture: ${ex.message}");
    }
  }

  Future<void> _processAudio(List<int> pcmData) async {
    if (_leopard == null) {
      return;
    }

    Stopwatch stopwatch = new Stopwatch()..start();
    String? transcript = await _leopard?.process(pcmData);
    Duration elapsed = stopwatch.elapsed;

    String audioLength = (pcmData.length / _leopard!.sampleRate).toStringAsFixed(1);
    String transcriptionTime = (elapsed.inMilliseconds / 1000).toStringAsFixed(1);

    setState(() {
      statusAreaText = "Transcribed ${audioLength}(s) of audio in ${transcriptionTime}(s)";
      transcriptText = transcript ?? "";
    });
  }

  Color picoBlue = Color.fromRGBO(55, 125, 255, 1);
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        key: _scaffoldKey,
        appBar: AppBar(
          title: const Text('Leopard Demo'),
          backgroundColor: picoBlue,
        ),
        body: Column(
          children: [
            buildLeopardTextArea(context),
            buildErrorMessage(context),
            buildLeopardStatusArea(context),
            buildStartButton(context),
            footer
          ],
        ),
      ),
    );
  }

  buildStartButton(BuildContext context) {
    final ButtonStyle buttonStyle = ElevatedButton.styleFrom(
        primary: picoBlue,
        shape: BeveledRectangleBorder(),
        textStyle: TextStyle(color: Colors.white));

    return Expanded(
      flex: 1,
      child: Container(
          child: SizedBox(
              width: 130,
              height: 65,
              child: ElevatedButton(
                style: buttonStyle,
                onPressed:
                    (isRecording) ? _stopRecording : _startRecording,
                child: Text(isRecording ? "Stop" : "Start",
                    style: TextStyle(fontSize: 30)),
              ))),
    );
  }

  buildLeopardTextArea(BuildContext context) {
    return Expanded(
        flex: 6,
        child: Container(
          alignment: Alignment.topCenter,
          color: Color(0xff25187e),
          margin: EdgeInsets.all(10),
          child: SingleChildScrollView(
            scrollDirection: Axis.vertical,
            padding: EdgeInsets.all(10),
            physics: RangeMaintainingScrollPhysics(),
            child: Align(
              alignment: Alignment.topLeft,
              child: Text(
                transcriptText,
                textAlign: TextAlign.left,
                style: TextStyle(color: Colors.white, fontSize: 20),
              )
            )
          )
        )
      );
  }

  buildLeopardStatusArea(BuildContext context) {
    return Expanded(
      flex: 1,
      child: Container(
          alignment: Alignment.center,
          padding: EdgeInsets.only(bottom: 20),
          child: Text(
            statusAreaText,
            style: TextStyle(color: Colors.black),
          )));
  }

  buildErrorMessage(BuildContext context) {
    return Expanded(
        flex: isError ? 2 : 0,
        child: Container(
            alignment: Alignment.center,
            margin: EdgeInsets.only(left: 20, right: 20),
            padding: EdgeInsets.all(5),
            decoration: !isError
                ? null
                : BoxDecoration(
                    color: Colors.red, borderRadius: BorderRadius.circular(5)),
            child: !isError
                ? null
                : Text(
                    errorMessage,
                    style: TextStyle(color: Colors.white, fontSize: 18),
                  )));
  }

  Widget footer = Expanded(
      flex: 1,
      child: Container(
          alignment: Alignment.bottomCenter,
          padding: EdgeInsets.only(bottom: 20),
          child: const Text(
            "Made in Vancouver, Canada by Picovoice",
            style: TextStyle(color: Color(0xff666666)),
          )));
}

typedef RecordedCallback = Function(double length);
typedef ProcessErrorCallback = Function(LeopardException error);

class MicRecorder {
  final VoiceProcessor? _voiceProcessor;
  int _sampleRate;

  final RecordedCallback _recordedCallback;
  final ProcessErrorCallback _processErrorCallback;
  RemoveListener? _removeVoiceProcessorListener;
  RemoveListener? _removeErrorListener;

  List<int> _pcmData = [];

  static Future<MicRecorder> create(int sampleRate, RecordedCallback recordedCallback, ProcessErrorCallback processErrorCallback) async {
    return MicRecorder._(sampleRate, recordedCallback, processErrorCallback);
  }

  MicRecorder._(this._sampleRate, this._recordedCallback, this._processErrorCallback)
      : _voiceProcessor = VoiceProcessor.getVoiceProcessor(512, _sampleRate) {
    if (_voiceProcessor == null) {
      throw LeopardRuntimeException("flutter_voice_processor not available.");
    }
    _removeVoiceProcessorListener =
        _voiceProcessor!.addListener((buffer) async {
      List<int> frame;
      try {
        frame = (buffer as List<dynamic>).cast<int>();
      } on Error {
        LeopardException castError = LeopardException(
            "flutter_voice_processor sent an unexpected data type.");
        _processErrorCallback(castError);
        return;
      }

      _pcmData.addAll(frame);
      _recordedCallback(_pcmData.length / _sampleRate);
    });

    _removeErrorListener = _voiceProcessor!.addErrorListener((errorMsg) {
      LeopardException nativeError = LeopardException(errorMsg as String);
      _processErrorCallback(nativeError);
    });
  }

  Future<void> startRecord() async {
    if (_voiceProcessor == null) {
      throw LeopardInvalidStateException(
          "Cannot start Leopard - resources have already been released");
    }

    _pcmData.clear();

    if (await _voiceProcessor?.hasRecordAudioPermission() ?? false) {
      try {
        await _voiceProcessor!.start();
      } on PlatformException {
        throw LeopardRuntimeException(
            "Audio engine failed to start. Hardware may not be supported.");
      }
    } else {
      throw LeopardRuntimeException(
          "User did not give permission to record audio.");
    }
  }

  Future<List<int>> stopRecord() async {
    if (_voiceProcessor == null) {
      throw LeopardInvalidStateException(
          "Cannot start Leopard - resources have already been released");
    }

    if (_voiceProcessor?.isRecording ?? false) {
      await _voiceProcessor!.stop();
    }

    return _pcmData;
  }

  Future<void> delete() async {
    if (_voiceProcessor?.isRecording ?? false) {
      await _voiceProcessor!.stop();
    }
    _removeVoiceProcessorListener?.call();
    _removeErrorListener?.call();
  }
}
