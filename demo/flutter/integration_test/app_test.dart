import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:wav/wav.dart';

import 'package:leopard_flutter/leopard.dart';
import 'package:leopard_flutter/leopard_error.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  final String accessKey = "{TESTING_ACCESS_KEY_HERE}";
  final String platform = Platform.isAndroid ? "android" : Platform.isIOS ? "ios" : throw ("Unsupported platform");

  Future<List<int>> loadAudioFile(String audioPath) async {
      const INT16_MAX = 32767;
      const INT16_MIN = -32768;

      var audioFileData = await rootBundle.load(audioPath);
      Wav audioFile = await Wav.read(audioFileData.buffer.asUint8List());
      List<int> pcm = audioFile.channels[0].map((f) {
          var i = (f * INT16_MAX).truncate();
          if (f > INT16_MAX) i = INT16_MAX;
          if (f < INT16_MIN) i = INT16_MIN;
          return i;
        }).toList();
    return pcm;
  }

  String getModelPath(String language) {
    return "assets/test_resources/model_files/leopard_params${language != "en" ? "_${language}" : ""}.pv";
  }

  String getAudioPath(String audioFile) {
    return "assets/test_resources/audio_samples/${audioFile}";
  }

  group('Leopard Process Tests', () {
    late dynamic testData;

    setUp(() async {
      String testDataJson = await rootBundle.loadString('assets/test_resources/test_data.json');
      testData = json.decode(testDataJson);
    });

    Future<void> runLeopardProcess(String language, String transcript, String[] punctuations, bool testPunctuations, double errorRate, String audioFile) async {
          String modelPath = getModelPath(language);

          String normTranscript = transcript;
          if (!testPunctuations) {
            // TODO
          }

          Leopard leopard;
          try {
             leopard = await Porcupine.fromKeywordPaths(
              accessKey,
              modelPath: modelPath,
              enableAutomaticPunctuation: testPunctuations);
          } on LeopardException catch (ex) {
            expect(ex, equals(null), reason: "Failed to initialize Leopard for ${language}: ${ex}");
            return;
          }

          String audioPath = getAudioPath(audioFile);
          List<int> pcm = await loadAudioFile(audioPath);
          LeopardTranscript res = await leopard.process(pcm);

          leopard.delete();
          expect(detections.length, equals(1), reason: "Number of detections for ${language} ${keyword} was incorrect");
          expect(detections[0], equals(0), reason: "Porcupine returned wrong keyword index for ${language} ${keyword}");
    }

    testWidgets('Test process all languages',
      (tester) async {
        for (int t = 0; t < testData['tests']['parameters'].length; t++) {
          String language = testData['tests']['parameters'][t]['language'];
          String transcript = testData['tests']['parameters'][t]['transcript'];
          String[] punctuations = testData['tests']['parameters'][t]['punctuations'];
          double errorRate = testData['tests']['parameters'][t]['error_rate'];
          String audioFile = testData['tests']['parameters'][t]['audio_file'];

          runLeopardProcess(language, transcript, punctuations, false, errorRate, audioFile);
        }
      });

    testWidgets('Test process all languages with punctuation',
      (tester) async {
        for (int t = 0; t < testData['tests']['parameters'].length; t++) {
          String language = testData['tests']['parameters'][t]['language'];
          String transcript = testData['tests']['parameters'][t]['transcript'];
          String[] punctuations = testData['tests']['parameters'][t]['punctuations'];
          double errorRate = testData['tests']['parameters'][t]['error_rate'];
          String audioFile = testData['tests']['parameters'][t]['audio_file'];

          runLeopardProcess(language, transcript, punctuations, true, errorRate, audioFile);
        }
      });
  });
}
