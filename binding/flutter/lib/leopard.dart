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
import 'dart:typed_data';

import 'package:flutter/services.dart';
import 'package:flutter/services.dart' show rootBundle;
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
  /// Thows a `LeopardException` if not initialized correctly
  ///
  /// returns an instance of the speech-to-text engine
  static Future<Leopard> create(String accessKey, String modelPath) async {
    modelPath = await _tryExtractFlutterAsset(modelPath);

    try {
      Map<String, dynamic> result =
          Map<String, dynamic>.from(await _channel.invokeMethod('create', {
        'accessKey': accessKey,
        'modelPath': modelPath,
      }));

      return Leopard._(result['handle'], result['sampleRate'], result['version']);
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
  /// returns String object.
  Future<String> process(List<int>? frame) async {
    try {
      Map<String, dynamic> transcript = Map<String, dynamic>.from(await _channel
          .invokeMethod('process', {'handle': _handle, 'frame': frame}));

      if (transcript['transcript'] == null) {
        throw LeopardInvalidStateException(
            "field 'transcript' must be always present");
      }

      return transcript['transcript'];
    } on PlatformException catch (error) {
      throw leopardStatusToException(error.code, error.message);
    } on Exception catch (error) {
      throw LeopardException(error.toString());
    }
  }

  /// Processes given audio data and returns its transcription.
  ///
  /// [path] Absolute path to the audio file. The file needs to have a sample rate equal to or greater
  ///        than Leopard.sampleRate. The supported formats are: `FLAC`, `MP3`, `Ogg`, `Opus`,
  ///        `Vorbis`, `WAV`, and `WebM`.
  ///
  /// returns String object.
  Future<String> processFile(String path) async {
    try {
      Map<String, dynamic> transcript = Map<String, dynamic>.from(await _channel
          .invokeMethod('processfile', {'handle': _handle, 'path': path}));

      if (transcript['transcript'] == null) {
        throw LeopardInvalidStateException(
            "field 'transcript' must be always present");
      }

      return transcript['transcript'];
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
