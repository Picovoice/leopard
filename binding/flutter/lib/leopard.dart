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

import 'dart:async';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:leopard_flutter/leopard_transcript.dart';
import 'package:path_provider/path_provider.dart';
import 'package:leopard_flutter/leopard_error.dart';

class Leopard {
  static final MethodChannel _channel = MethodChannel("leopard");

  String? _handle;
  final int _sampleRate;
  final String _version;

  /// Leopard version string
  String get version => _version;

  /// The audio sample rate required by Leopard
  int get sampleRate => _sampleRate;

  /// Static creator for initializing Leopard
  ///
  /// [accessKey] AccessKey obtained from Picovoice Console (https://console.picovoice.ai/).
  ///
  /// [modelPath] Path to the file containing model parameters.
  ///
  /// [enableAutomaticPunctuation] (Optional) Set to `true` to enable automatic punctuation insertion.
  ///
  /// [enableDiarization] (Optional) Set to `true` to enable speaker diarization, which allows Leopard to
  ///                     differentiate speakers as part of the transcription process. Word
  ///                     metadata will include a `speaker_tag` to identify unique speakers.
  /// 
  /// Throws a `LeopardException` if not initialized correctly
  ///
  /// returns an instance of the Leopard Speech-to-Text engine
  static Future<Leopard> create(String accessKey, String modelPath,
      {
        enableAutomaticPunctuation = false,
        enableDiarization = false
      }) async {
    modelPath = await _tryExtractFlutterAsset(modelPath);

    try {
      Map<String, dynamic> result =
          Map<String, dynamic>.from(await _channel.invokeMethod('create', {
        'accessKey': accessKey,
        'modelPath': modelPath,
        'enableAutomaticPunctuation': enableAutomaticPunctuation,
        'enableDiarization': enableDiarization
      }));

      return Leopard._(
          result['handle'], result['sampleRate'], result['version']);
    } on PlatformException catch (error) {
      throw leopardStatusToException(error.code, error.message);
    } on Exception catch (error) {
      throw LeopardException(error.toString());
    }
  }

  // private constructor
  Leopard._(this._handle, this._sampleRate, this._version);

  /// Process a frame of pcm audio with the speech-to-text engine.
  ///
  /// [frame] frame of 16-bit integers of 16kHz linear PCM mono audio.
  ///
  /// returns LeopardTranscript object which contains the transcription results of the engine.
  Future<LeopardTranscript> process(List<int>? frame) async {
    try {
      Map<String, dynamic> result = Map<String, dynamic>.from(await _channel
          .invokeMethod('process', {'handle': _handle, 'frame': frame}));

      return _pluginResultToLeopardTranscript(result);
    } on PlatformException catch (error) {
      throw leopardStatusToException(error.code, error.message);
    } on Exception catch (error) {
      throw LeopardException(error.toString());
    }
  }

  /// Processes given audio data and returns its transcription.
  ///
  /// [path] Absolute path to the audio file. The supported formats are: `3gp (AMR)`, `FLAC`,
  ///        `MP3`, `MP4/m4a (AAC)`, `Ogg`, `WAV` and `WebM`.
  ///
  /// returns LeopardTranscript object which contains the transcription results of the engine.
  Future<LeopardTranscript> processFile(String path) async {
    try {
      Map<String, dynamic> result = Map<String, dynamic>.from(await _channel
          .invokeMethod('processfile', {'handle': _handle, 'path': path}));

      return _pluginResultToLeopardTranscript(result);
    } on PlatformException catch (error) {
      throw leopardStatusToException(error.code, error.message);
    } on Exception catch (error) {
      throw LeopardException(error.toString());
    }
  }

  /// Frees memory that was allocated for Leopard
  Future<void> delete() async {
    if (_handle != null) {
      await _channel.invokeMethod('delete', {'handle': _handle});
      _handle = null;
    }
  }

  LeopardTranscript _pluginResultToLeopardTranscript(
      Map<String, dynamic> result) {
    if (result['transcript'] == null) {
      throw LeopardInvalidStateException(
          "field 'transcript' must be always present");
    }

    String transcript = result['transcript'];

    if (result['words'] == null) {
      throw LeopardInvalidStateException(
          "field 'words' must be always present");
    } else {
      result['words'] = List<dynamic>.from(result['words']);
    }

    List<LeopardWord> words = [];
    for (dynamic word in result['words']) {
      words.add(LeopardWord(
          word['word'],
          word['startSec'],
          word['endSec'],
          word['confidence'],
          word['speakerTag']));
    }
    return LeopardTranscript(transcript, words);
  }

  static Future<String> _tryExtractFlutterAsset(String filePath) async {
    ByteData data;
    try {
      data = await rootBundle.load(filePath);
    } catch (_) {
      // In flutter, a resource can be added through flutter's assets directory
      // or natively (res for android; bundle for iOS). We try to extract
      // a resource in flutter's assets directory and if it fails, try to load
      // the resource using native modules.
      return filePath;
    }

    try {
      String resourceDirectory =
          (await getApplicationDocumentsDirectory()).path;
      String outputPath = '$resourceDirectory/$filePath';
      File outputFile = File(outputPath);
      final buffer = data.buffer;

      await outputFile.create(recursive: true);
      await outputFile.writeAsBytes(
          buffer.asUint8List(data.offsetInBytes, data.lengthInBytes));
      return outputPath;
    } catch (_) {
      throw LeopardIOException("failed to extract '$filePath'");
    }
  }
}
