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
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/services.dart';
import 'package:flutter_voice_processor/flutter_voice_processor.dart';
import 'package:leopard_flutter/leopard_error.dart';
import 'package:path_provider/path_provider.dart';

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
          "Cannot start audio recording - resources have already been released");
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

  Future<File> stopRecord() async {
    if (_voiceProcessor == null) {
      throw LeopardInvalidStateException(
          "Cannot stop audio recording - resources have already been released");
    }

    if (_voiceProcessor?.isRecording ?? false) {
      await _voiceProcessor!.stop();
    }

    try {
      return await writeWavFile();
    } catch(e) {
      throw LeopardIOException(
          "Failed to save recorded audio to file.");
    }
  }

  Future<File> writeWavFile() async {
    final int channelCount = 1;
    final int bitDepth = 16;
    final int sampleRate = 16000;

    final directory = await getApplicationDocumentsDirectory();
    final wavFile = File('${directory.path}/recording.wav');

    final bytesBuilder = BytesBuilder();

    void writeString(String s) {
      final stringBuffer = utf8.encode(s);
      bytesBuilder.add(stringBuffer);
    }

    void writeUint32(int value) {
      final uint32Buffer = Uint8List(4)..buffer.asByteData().setUint32(0, value, Endian.little);
      bytesBuilder.add(uint32Buffer);
    }

    void writeUint16(int value) {
      final uint16Buffer = Uint8List(2)..buffer.asByteData().setUint16(0, value, Endian.little);
      bytesBuilder.add(uint16Buffer);
    }

    void writeInt16(int value) {
      final int16Buffer = Uint8List(2)..buffer.asByteData().setInt16(0, value, Endian.little);
      bytesBuilder.add(int16Buffer);
    }

    writeString('RIFF');
    writeUint32(((bitDepth / 8) * _pcmData.length + 36).toInt());
    writeString('WAVE');
    writeString('fmt ');
    writeUint32(16);
    writeUint16(1);
    writeUint16(channelCount);
    writeUint32(sampleRate);
    writeUint32(((sampleRate * channelCount * bitDepth) / 8).toInt());
    writeUint16(((channelCount * bitDepth) / 8).toInt());
    writeUint16(bitDepth);
    writeString('data');
    writeUint32(((bitDepth / 8) * _pcmData.length).toInt());

    for (int i = 0; i < _pcmData.length; i++) {
      writeInt16(_pcmData[i]);
    }

    return wavFile.writeAsBytes(bytesBuilder.toBytes());
  }

  Future<void> delete() async {
    if (_voiceProcessor?.isRecording ?? false) {
      await _voiceProcessor!.stop();
    }
    _removeVoiceProcessorListener?.call();
    _removeErrorListener?.call();
  }
}
