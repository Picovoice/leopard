import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:path_provider/path_provider.dart';

import 'package:leopard_flutter/leopard.dart';
import 'package:leopard_flutter/leopard_transcript.dart';
import 'package:leopard_flutter/leopard_error.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  final String accessKey = "{TESTING_ACCESS_KEY_HERE}";

  String getModelPath(String language) {
    return "assets/test_resources/model_files/leopard_params${language != "en" ? "_$language" : ""}.pv";
  }

  String getAudioPath(String audioFile) {
    return "assets/test_resources/audio_samples/$audioFile";
  }

  Future<List<int>> loadAudioFile(String audioFile) async {
    String audioPath = getAudioPath(audioFile);

    List<int> pcm = [];
    var audioFileData = await rootBundle.load(audioPath);
    for (int i = 44; i < audioFileData.lengthInBytes; i += 2) {
      pcm.add(audioFileData.getInt16(i, Endian.little));
    }
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
    return levenshteinDistance(transcript, expectedTranscript) /
        expectedTranscript.length;
  }

  Future<void> validateMetadata(
      List<LeopardWord> words,
      List<dynamic> expectedWords,
      bool enableDiarization) async {
    expect(words.length, expectedWords.length);
    for (var i = 0; i < words.length; i++) {
      expect(words[i].word, expectedWords[i]["word"]);
      expect(words[i].startSec, closeTo(expectedWords[i]["start_sec"], 0.01));
      expect(words[i].endSec, closeTo(expectedWords[i]["end_sec"], 0.01));
      expect(words[i].confidence, closeTo(expectedWords[i]["confidence"], 0.01));
      if (enableDiarization) {
        expect(words[i].speakerTag, expectedWords[i]["speaker_tag"]);
      } else {
        expect(words[i].speakerTag, -1);
      }
    }
  }

  group('Leopard Process Tests', () {
    late dynamic testData;

    setUp(() async {
      String testDataJson =
          await rootBundle.loadString('assets/test_resources/test_data.json');
      testData = json.decode(testDataJson);
    });

    Future<void> runLeopardProcess(
        String language,
        String expectedTranscript,
        List<dynamic> expectedWords,
        double errorRate,
        String audioFile,
        {
          bool asFile = false,
          bool enableAutomaticPunctuation = false,
          bool enableDiarization = false
        }) async {
      String modelPath = getModelPath(language);

      Leopard leopard;
      try {
        leopard = await Leopard.create(accessKey,
            modelPath,
            enableAutomaticPunctuation: enableAutomaticPunctuation,
            enableDiarization: enableDiarization
          );
      } on LeopardException catch (ex) {
        expect(ex, equals(null),
            reason: "Failed to initialize Leopard for $language: ${ex.message}");
        return;
      }

      LeopardTranscript res;
      if (asFile) {
        String audioPath = await extractAudioFile(audioFile);
        res = await leopard.processFile(audioPath);
      } else {
        List<int> pcm = await loadAudioFile(audioFile);
        res = await leopard.process(pcm);
      }

      leopard.delete();

      expect(characterErrorRate(res.transcript, expectedTranscript),
          lessThanOrEqualTo(errorRate),
          reason: "Character error rate for $language was incorrect");
      await validateMetadata(res.words, expectedWords, enableDiarization);
    }

    testWidgets('Test process all languages', (tester) async {
      for (int t = 0; t < testData['tests']['language_tests'].length; t++) {
        String language = testData['tests']['language_tests'][t]['language'];
        String transcript = testData['tests']['language_tests'][t]['transcript'];
        List<dynamic> expectedWords = testData['tests']['language_tests'][t]['words'];
        double errorRate = testData['tests']['language_tests'][t]['error_rate'];
        String audioFile = testData['tests']['language_tests'][t]['audio_file'];

        await runLeopardProcess(
            language, transcript, expectedWords, errorRate, audioFile);
      }
    });

    testWidgets('Test process all languages with punctuation', (tester) async {
      for (int t = 0; t < testData['tests']['language_tests'].length; t++) {
        String language = testData['tests']['language_tests'][t]['language'];
        String transcriptWithPunctuation = testData['tests']['language_tests'][t]['transcript_with_punctuation'];
        List<dynamic> expectedWords = testData['tests']['language_tests'][t]['words'];
        double errorRate = testData['tests']['language_tests'][t]['error_rate'];
        String audioFile = testData['tests']['language_tests'][t]['audio_file'];

        await runLeopardProcess(
            language,
            transcriptWithPunctuation,
            expectedWords,
            errorRate,
            audioFile,
            enableAutomaticPunctuation: true);
      }
    });

    testWidgets('Test process file all languages', (tester) async {
      for (int t = 0; t < testData['tests']['language_tests'].length; t++) {
        String language = testData['tests']['language_tests'][t]['language'];
        String transcript = testData['tests']['language_tests'][t]['transcript'];
        List<dynamic> expectedWords = testData['tests']['language_tests'][t]['words'];
        double errorRate = testData['tests']['language_tests'][t]['error_rate'];
        String audioFile = testData['tests']['language_tests'][t]['audio_file'];

        await runLeopardProcess(
            language,
            transcript,
            expectedWords,
            errorRate,
            audioFile,
            asFile: true);
      }
    });

    testWidgets('Test process file all languages with diarization', (tester) async {
      for (int t = 0; t < testData['tests']['language_tests'].length; t++) {
        String language = testData['tests']['language_tests'][t]['language'];
        String transcript = testData['tests']['language_tests'][t]['transcript'];
        List<dynamic> expectedWords = testData['tests']['language_tests'][t]['words'];
        double errorRate = testData['tests']['language_tests'][t]['error_rate'];
        String audioFile = testData['tests']['language_tests'][t]['audio_file'];

        await runLeopardProcess(
            language,
            transcript,
            expectedWords,
            errorRate,
            audioFile,
            enableDiarization: true);
      }
    });

    testWidgets('Test diarization with multiple speakers', (tester) async {
      for (int t = 0; t < testData['tests']['diarization_tests'].length; t++) {
        String language = testData['tests']['diarization_tests'][t]['language'];
        List<dynamic> expectedWords = testData['tests']['diarization_tests'][t]['words'];
        String audioFile = testData['tests']['diarization_tests'][t]['audio_file'];

        String modelPath = getModelPath(language);
        Leopard leopard;
        try {
          leopard = await Leopard.create(accessKey,
              modelPath,
              enableDiarization: true
            );
        } on LeopardException catch (ex) {
          expect(ex, equals(null),
              reason: "Failed to initialize Leopard for $language: ${ex.message}");
          return;
        }

        String audioPath = await extractAudioFile(audioFile);
        LeopardTranscript res = await leopard.processFile(audioPath);
        leopard.delete();

        expect(res.words.length, expectedWords.length);
        for (var i = 0; i < res.words.length; i++) {
          expect(res.words[i].word, expectedWords[i]["word"]);
          expect(res.words[i].speakerTag, expectedWords[i]["speaker_tag"]);
        }
      }
    });
  });
}
