//
// Copyright 2022-2025 Picovoice Inc.
//
// You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
// file accompanying this source.
//
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
// an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.
//

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:leopard_demo/mic_recorder.dart';
import 'package:leopard_flutter/leopard.dart';
import 'package:leopard_flutter/leopard_error.dart';
import 'package:leopard_flutter/leopard_transcript.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  MyAppState createState() => MyAppState();
}

class MyAppState extends State<MyApp> {
  final String accessKey =
      '{YOUR_ACCESS_KEY_HERE}'; // AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)
  final int maxRecordingLengthSecs = 120;

  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  bool isError = false;
  String errorMessage = "";

  bool isButtonDisabled = false;
  bool isRecording = false;
  bool isProcessing = false;
  double recordedLength = 0.0;
  String statusAreaText = "";
  String transcriptText = "";
  List<LeopardWord> words = [];

  MicRecorder? _micRecorder;
  Leopard? _leopard;

  @override
  void initState() {
    super.initState();
    setState(() {
      isButtonDisabled = true;
      recordedLength = 0.0;
      statusAreaText = "Initializing Leopard...";
      transcriptText = "";
      words = [];
    });

    initLeopard();
  }

  Future<void> initLeopard() async {
    String language = "";
    try {
      final paramsString = await DefaultAssetBundle.of(
        context,
      ).loadString('assets/params.json');
      final params = json.decode(paramsString);

      language = params["language"];
    } catch (_) {
      errorCallback(
        LeopardException(
          "Could not find `params.json`. Ensure 'prepare_demo.dart' script was run before launching the demo.",
        ),
      );
      return;
    }

    final String suffix = language != "en" ? "_$language" : "";
    final String modelPath = "assets/models/leopard_params$suffix.pv";

    try {
      _leopard = await Leopard.create(
        accessKey,
        modelPath,
        enableAutomaticPunctuation: true,
        enableDiarization: true,
      );
      _micRecorder = await MicRecorder.create(
        _leopard!.sampleRate,
        recordedCallback,
        errorCallback,
      );
      setState(() {
        statusAreaText =
            "Press START to start recording some audio to transcribe";
        isButtonDisabled = false;
      });
    } on LeopardActivationException {
      errorCallback(LeopardActivationException("AccessKey activation error."));
    } on LeopardActivationLimitException {
      errorCallback(
        LeopardActivationLimitException("AccessKey reached its device limit."),
      );
    } on LeopardActivationRefusedException {
      errorCallback(LeopardActivationRefusedException("AccessKey refused."));
    } on LeopardActivationThrottledException {
      errorCallback(
        LeopardActivationThrottledException("AccessKey has been throttled."),
      );
    } on LeopardException catch (ex) {
      errorCallback(ex);
    }
  }

  Future<void> recordedCallback(double length) async {
    if (length < maxRecordingLengthSecs) {
      setState(() {
        recordedLength = length;
        statusAreaText =
            "Recording : ${length.toStringAsFixed(1)} / $maxRecordingLengthSecs seconds";
      });
    } else {
      setState(() {
        isButtonDisabled = true;
        recordedLength = length;
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
      errorCallback(ex);
    }
  }

  Future<void> _stopRecording() async {
    if (!isRecording || _micRecorder == null) {
      return;
    }

    try {
      File recordedFile = await _micRecorder!.stopRecord();
      setState(() {
        statusAreaText = "Transcribing, please wait...";
        isRecording = false;
        isButtonDisabled = true;
      });
      _processAudio(recordedFile);
    } on LeopardException catch (ex) {
      errorCallback(ex);
    }
  }

  Future<void> _processAudio(File recordedFile) async {
    if (_leopard == null) {
      return;
    }

    Stopwatch stopwatch = Stopwatch()..start();
    LeopardTranscript? result = await _leopard?.processFile(recordedFile.path);
    Duration elapsed = stopwatch.elapsed;

    String audioLength = recordedLength.toStringAsFixed(1);
    String transcriptionTime = (elapsed.inMilliseconds / 1000).toStringAsFixed(
      1,
    );

    setState(() {
      statusAreaText =
          "Transcribed $audioLength(s) of audio in $transcriptionTime(s)";
      transcriptText = result?.transcript ?? "";
      words = result?.words ?? [];
      isButtonDisabled = false;
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
        body: Container(
          color: Colors.white,
          child: Column(
            children: [
              buildLeopardTextArea(context),
              buildLeopardWordArea(context),
              buildErrorMessage(context),
              buildLeopardStatusArea(context),
              buildStartButton(context),
              footer,
            ],
          ),
        ),
      ),
    );
  }

  buildStartButton(BuildContext context) {
    final ButtonStyle buttonStyle = ElevatedButton.styleFrom(
      backgroundColor: picoBlue,
      shape: BeveledRectangleBorder(),
      textStyle: TextStyle(color: Colors.white),
    );

    return Expanded(
      flex: 1,
      child: SizedBox(
        width: 130,
        height: 65,
        child: ElevatedButton(
          style: buttonStyle,
          onPressed: (isButtonDisabled || isError)
              ? null
              : isRecording
                  ? _stopRecording
                  : _startRecording,
          child: Text(
            isRecording ? "Stop" : "Start",
            style: TextStyle(fontSize: 30),
          ),
        ),
      ),
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
            ),
          ),
        ),
      ),
    );
  }

  buildLeopardWordArea(BuildContext context) {
    List<TableRow> tableRows = words.map<TableRow>((leopardWord) {
      return TableRow(
        children: [
          Column(
            children: [
              Text(leopardWord.word, style: TextStyle(color: Colors.white)),
            ],
          ),
          Column(
            children: [
              Text(
                '${leopardWord.startSec.toStringAsFixed(2)}s',
                style: TextStyle(color: Colors.white),
              ),
            ],
          ),
          Column(
            children: [
              Text(
                '${leopardWord.endSec.toStringAsFixed(2)}s',
                style: TextStyle(color: Colors.white),
              ),
            ],
          ),
          Column(
            children: [
              Text(
                '${(leopardWord.confidence * 100).toStringAsFixed(0)}%',
                style: TextStyle(color: Colors.white),
              ),
            ],
          ),
          Column(
            children: [
              Text(
                '${leopardWord.speakerTag}',
                style: TextStyle(color: Colors.white),
              ),
            ],
          ),
        ],
      );
    }).toList();

    return Expanded(
      flex: 4,
      child: Container(
        color: Color(0xff25187e),
        alignment: Alignment.topCenter,
        margin: EdgeInsets.all(10),
        child: Column(
          children: [
            Container(
              color: Colors.white,
              padding: EdgeInsets.only(bottom: 5, top: 5),
              child: Table(
                children: [
                  TableRow(
                    children: [
                      Column(children: [Text("Word")]),
                      Column(children: [Text("Start")]),
                      Column(children: [Text("End")]),
                      Column(children: [Text("Confidence")]),
                      Column(children: [Text("Tag")]),
                    ],
                  ),
                ],
              ),
            ),
            Flexible(
              child: SingleChildScrollView(
                scrollDirection: Axis.vertical,
                padding: EdgeInsets.all(10),
                physics: RangeMaintainingScrollPhysics(),
                child: Table(children: tableRows),
              ),
            ),
          ],
        ),
      ),
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
          textAlign: TextAlign.center,
          softWrap: true,
          overflow: TextOverflow.visible,
          style: TextStyle(color: Colors.black),
        ),
      ),
    );
  }

  buildErrorMessage(BuildContext context) {
    return Expanded(
      flex: isError ? 4 : 0,
      child: Container(
        alignment: Alignment.center,
        margin: EdgeInsets.only(left: 20, right: 20),
        padding: EdgeInsets.all(5),
        decoration: !isError
            ? null
            : BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(5),
              ),
        child: !isError
            ? null
            : Text(
                errorMessage,
                style: TextStyle(color: Colors.white, fontSize: 18),
              ),
      ),
    );
  }

  Widget footer = Expanded(
    flex: 1,
    child: Container(
      alignment: Alignment.bottomCenter,
      padding: EdgeInsets.only(bottom: 10),
      margin: EdgeInsets.only(top: 10),
      child: const Text(
        "Made in Vancouver, Canada by Picovoice",
        style: TextStyle(color: Color(0xff666666)),
      ),
    ),
  );
}
