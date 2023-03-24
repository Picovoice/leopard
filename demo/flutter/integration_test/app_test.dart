import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:path_provider/path_provider.dart';
import 'package:wav/wav.dart';

import 'package:leopard_flutter/leopard.dart';
import 'package:leopard_flutter/leopard_transcript.dart';
import 'package:leopard_flutter/leopard_error.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  final String accessKey = "{TESTING_ACCESS_KEY_HERE}";
  final String platform = Platform.isAndroid ? "android" : Platform.isIOS ? "ios" : throw ("Unsupported platform");

  String getModelPath(String language) {
    return "assets/test_resources/model_files/leopard_params${language != "en" ? "_${language}" : ""}.pv";
  }

  String getAudioPath(String audioFile) {
    return "assets/test_resources/audio_samples/${audioFile}";
  }

  Future<List<int>> loadAudioFile(String audioFile) async {
    const INT16_MAX = 32767;
    const INT16_MIN = -32768;

    String audioPath = getAudioPath(audioFile);
    var audioFileData = await rootBundle.load(audioPath);
    Wav audio = await Wav.read(audioFileData.buffer.asUint8List());
    List<int> pcm = audio.channels[0].map((f) {
        var i = (f * INT16_MAX).truncate();
        if (f > INT16_MAX) i = INT16_MAX;
        if (f < INT16_MIN) i = INT16_MIN;
        return i;
      }).toList();
    return pcm;
  }

  Future<String> extractAudioFile(String audioFile) async {
    String audioPath = getAudioPath(audioFile);
    var audioFileData = await rootBundle.load(audioPath);

    final targetDirectory = await getApplicationDocumentsDirectory();
    String targetDirPath = targetDirectory.path;
    String targetPath = '$targetDirPath/$audioFile';
    File targetFile = File(targetPath);
    await targetFile.writeAsBytes(audioFileData.buffer.asUint8List());

    return targetPath;
  }

  int levenshteinDistance(String s1, String s2) {
    if (s1 == s2) {
      return 0;
    }

    if (s1.isEmpty) {
      return s2.length;
    }

    if (s2.isEmpty) {
      return s1.length;
    }

    List<int> v0 = List<int>.filled(s2.length + 1, 0);
    List<int> v1 = List<int>.filled(s2.length + 1, 0);
    List<int> vTemp;

    for (var i = 0; i < v0.length; i++) {
      v0[i] = i;
    }

    for (var i = 0; i < s1.length; i++) {
      v1[0] = i + 1;

      for (var j = 0; j < s2.length; j++) {
        int cost = 1;
        if (s1.codeUnitAt(i) == s2.codeUnitAt(j)) {
          cost = 0;
        }
        v1[j + 1] = min(v1[j] + 1, min(v0[j + 1] + 1, v0[j] + cost));
      }

      vTemp = v0;
      v0 = v1;
      v1 = vTemp;
    }

    return v0[s2.length];
  }

  double characterErrorRate(String transcript, String expectedTranscript) {
    return levenshteinDistance(transcript, expectedTranscript) / expectedTranscript.length;
  }

  Future<void> validateMetadata(List<LeopardWord> words, String transcript, double audioLength) async {
    String normTranscript = transcript.toUpperCase();
    for(var i = 0; i < words.length; i++) {
      LeopardWord word = words[i];
      expect(normTranscript, contains(word.word.toUpperCase()));
      expect(word.startSec, greaterThan(0));
      expect(word.startSec, lessThanOrEqualTo(word.endSec));
      if (i < (words.length - 1)) {
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

      List<int> pcm = await loadAudioFile(audioFile);
      LeopardTranscript res = await leopard.process(pcm);

      leopard.delete();

      expect(characterErrorRate(res.transcript, normTranscript), lessThanOrEqualTo(errorRate), reason: "Character error rate for ${language} was incorrect");
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

      String audioPath = await extractAudioFile(audioFile);
      LeopardTranscript res = await leopard.processFile(audioPath);

      leopard.delete();

      List<int> pcm = await loadAudioFile(audioFile);
      expect(characterErrorRate(res.transcript, normTranscript), lessThanOrEqualTo(errorRate), reason: "Character error rate for ${language} was incorrect");
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
