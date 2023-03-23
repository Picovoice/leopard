import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:wav/wav.dart';
import 'package:dart_levenshtein/dart_levenshtein.dart';

import 'package:leopard_flutter/leopard.dart';
import 'package:leopard_flutter/leopard_transcript.dart';
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

  Future<double> characterErrorRate(String transcript, String expectedTranscript) async {
    return await transcript.levenshteinDistance(expectedTranscript) / expectedTranscript.length;
  }

  Future<void> validateMetadata(List<LeopardWord> words, String transcript, double audioLength) async {
    String normTranscript = transcript.toUpperCase();
    for(var i = 0; i < transcript.length; i++) {
      LeopardWord word = words[i];
      expect(normTranscript, contains(word.word.toUpperCase()));
      expect(word.startSec, greaterThan(0));
      expect(word.startSec, lessThanOrEqualTo(word.endSec));
      if (i < (transcript.length - 1)) {
        LeopardWord nextWord = words[i + 1];
        expect(word.endSec, lessThanOrEqualTo(nextWord.startSec));
      }
      expect(word.endSec, lessThanOrEqualTo(audioLength));

      expect(word.confidence, greaterThanOrEqualTo(0));
      expect(word.confidence, lessThanOrEqualTo(1));
    }
  }

  group('Leopard Process Tests', () {
    late dynamic testData;

    setUp(() async {
      String testDataJson = await rootBundle.loadString('assets/test_resources/test_data.json');
      testData = json.decode(testDataJson);
    });

    Future<void> runLeopardProcess(String language, String transcript, List<String> punctuations, bool testPunctuations, double errorRate, String audioFile) async {
      String modelPath = getModelPath(language);

      String normTranscript = transcript;
      if (!testPunctuations) {
        punctuations.forEach((p) {
          normTranscript = normTranscript.replaceAll(p, "");
        });
      }

      Leopard leopard;
      try {
         leopard = await Leopard.create(
          accessKey,
          modelPath,
          enableAutomaticPunctuation: testPunctuations);
      } on LeopardException catch (ex) {
        expect(ex, equals(null), reason: "Failed to initialize Leopard for ${language}: ${ex}");
        return;
      }

      String audioPath = getAudioPath(audioFile);
      List<int> pcm = await loadAudioFile(audioPath);
      LeopardTranscript res = await leopard.process(pcm);

      leopard.delete();

      expect(await characterErrorRate(res.transcript, normTranscript), lessThanOrEqualTo(errorRate), reason: "Character error rate for ${language} was incorrect");
      await validateMetadata(res.words, res.transcript, pcm.length / leopard.sampleRate);
    }

    Future<void> runLeopardProcessFile(String language, String transcript, List<String> punctuations, bool testPunctuations, double errorRate, String audioFile) async {
      String modelPath = getModelPath(language);

      String normTranscript = transcript;
      if (!testPunctuations) {
        punctuations.forEach((p) {
          normTranscript = normTranscript.replaceAll(p, "");
        });
      }

      Leopard leopard;
      try {
         leopard = await Leopard.create(
          accessKey,
          modelPath,
          enableAutomaticPunctuation: testPunctuations);
      } on LeopardException catch (ex) {
        expect(ex, equals(null), reason: "Failed to initialize Leopard for ${language}: ${ex}");
        return;
      }

      String audioPath = getAudioPath(audioFile);
      LeopardTranscript res = await leopard.processFile(audioPath);

      leopard.delete();

      List<int> pcm = await loadAudioFile(audioPath);
      expect(await characterErrorRate(res.transcript, normTranscript), lessThanOrEqualTo(errorRate), reason: "Character error rate for ${language} was incorrect");
      await validateMetadata(res.words, res.transcript, pcm.length / leopard.sampleRate);
    }

    testWidgets('Test process all languages',
      (tester) async {
        for (int t = 0; t < testData['tests']['parameters'].length; t++) {
          String language = testData['tests']['parameters'][t]['language'];
          String transcript = testData['tests']['parameters'][t]['transcript'];
          List<dynamic> punctuationsRaw = testData['tests']['parameters'][t]['punctuations'];
          List<String> punctuations = punctuationsRaw.map((p) => p.toString()).toList();
          double errorRate = testData['tests']['parameters'][t]['error_rate'];
          String audioFile = testData['tests']['parameters'][t]['audio_file'];

          await runLeopardProcess(language, transcript, punctuations, false, errorRate, audioFile);
        }
      });

    testWidgets('Test process all languages with punctuation',
      (tester) async {
        for (int t = 0; t < testData['tests']['parameters'].length; t++) {
          String language = testData['tests']['parameters'][t]['language'];
          String transcript = testData['tests']['parameters'][t]['transcript'];
          List<dynamic> punctuationsRaw = testData['tests']['parameters'][t]['punctuations'];
          List<String> punctuations = punctuationsRaw.map((p) => p.toString()).toList();
          double errorRate = testData['tests']['parameters'][t]['error_rate'];
          String audioFile = testData['tests']['parameters'][t]['audio_file'];

          await runLeopardProcess(language, transcript, punctuations, true, errorRate, audioFile);
        }
      });

    testWidgets('Test process file all languages',
      (tester) async {
        for (int t = 0; t < testData['tests']['parameters'].length; t++) {
          String language = testData['tests']['parameters'][t]['language'];
          String transcript = testData['tests']['parameters'][t]['transcript'];
          List<dynamic> punctuationsRaw = testData['tests']['parameters'][t]['punctuations'];
          List<String> punctuations = punctuationsRaw.map((p) => p.toString()).toList();
          double errorRate = testData['tests']['parameters'][t]['error_rate'];
          String audioFile = testData['tests']['parameters'][t]['audio_file'];

          await runLeopardProcessFile(language, transcript, punctuations, false, errorRate, audioFile);
        }
      });

    testWidgets('Test process file all languages with punctuation',
      (tester) async {
        for (int t = 0; t < testData['tests']['parameters'].length; t++) {
          String language = testData['tests']['parameters'][t]['language'];
          String transcript = testData['tests']['parameters'][t]['transcript'];
          List<dynamic> punctuationsRaw = testData['tests']['parameters'][t]['punctuations'];
          List<String> punctuations = punctuationsRaw.map((p) => p.toString()).toList();
          double errorRate = testData['tests']['parameters'][t]['error_rate'];
          String audioFile = testData['tests']['parameters'][t]['audio_file'];

          await runLeopardProcessFile(language, transcript, punctuations, true, errorRate, audioFile);
        }
      });
  });
}
