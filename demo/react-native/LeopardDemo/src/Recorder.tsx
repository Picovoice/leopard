import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

class Recorder {
  _recordingPath: string;
  _encoding: string = 'ascii';
  _totalCount: number = 0;

  constructor() {
    if (Platform.OS === 'android') {
      this._recordingPath = `${RNFS.DocumentDirectoryPath}/recording.wav`;
    } else if (Platform.OS === 'ios') {
      this._recordingPath = `${RNFS.MainBundlePath}/recording.wav`;
    } else {
      throw new Error('Unsupported platform');
    }
  }

  public async resetFile(): Promise<void> {
    this._totalCount = 0;
    const exists = await RNFS.exists(this._recordingPath);
    if (exists) {
      await RNFS.unlink(this._recordingPath);
    }
  }

  public async writeWavHeader(
    totalSampleCount = 0,
    channelCount = 1,
    bitDepth = 16,
    sampleRate = 16000,
  ): Promise<void> {
    // writing wav buffer
    // source: https://gist.github.com/also/900023
    const buffer = new ArrayBuffer(44);
    const dv = new DataView(buffer);

    let p = 0;

    function writeString(s: string) {
      for (let i = 0; i < s.length; i++) {
        dv.setUint8(p + i, s.charCodeAt(i));
      }
      p += s.length;
    }

    function writeUint32(d: number) {
      dv.setUint32(p, d, true);
      p += 4;
    }

    function writeUint16(d: number) {
      dv.setUint16(p, d, true);
      p += 2;
    }

    writeString('RIFF');
    writeUint32((bitDepth / 8) * totalSampleCount + 36);
    writeString('WAVE');
    writeString('fmt ');
    writeUint32(16);
    writeUint16(1);
    writeUint16(channelCount);
    writeUint32(sampleRate);
    writeUint32((sampleRate * channelCount * bitDepth) / 8);
    writeUint16((channelCount * bitDepth) / 8);
    writeUint16(bitDepth);
    writeString('data');
    writeUint32((bitDepth / 8) * totalSampleCount);

    const header = Recorder.bufferToString(buffer);
    this._totalCount = totalSampleCount;

    await RNFS.write(this._recordingPath, header, 0, this._encoding);
  }

  public async writeSamples(pcm: number[]): Promise<void> {
    const buffer = new ArrayBuffer(pcm.length * 2);
    const dv = new DataView(buffer);

    let p = 0;

    function writeInt16(d: number) {
      dv.setInt16(p, d, true);
      p += 2;
    }

    for (let i = 0; i < pcm.length; i++) {
      writeInt16(pcm[i]);
    }

    const data = Recorder.bufferToString(buffer);
    await RNFS.appendFile(this._recordingPath, data, this._encoding);
    this._totalCount += pcm.length;
  }

  public async finalize(): Promise<string> {
    await this.writeWavHeader(this._totalCount);
    return this._recordingPath;
  }

  private static bufferToString(buffer: ArrayBuffer): string {
    let res = '';
    const bytes = new Uint8Array(buffer);
    for (const byte of bytes) {
      res += String.fromCharCode(byte);
    }
    return res;
  }
}

export default Recorder;
