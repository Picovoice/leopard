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
'use strict';

import { Leopard, LeopardWord, LeopardInvalidArgumentError } from '../src';

import * as fs from 'fs';
import { WaveFile } from 'wavefile';

import { getSystemLibraryPath } from '../src/platforms';

import {
  getModelPathByLanguage,
  getAudioFile,
  getTestParameters,
} from './test_utils';

const TEST_PARAMETERS = getTestParameters();

const ACCESS_KEY = process.argv
  .filter(x => x.startsWith('--access_key='))[0]
  .split('--access_key=')[1];

const levenshteinDistance = (words1: string[], words2: string[]) => {
  const res = Array.from(
    Array(words1.length + 1),
    () => new Array(words2.length + 1)
  );
  for (let i = 0; i <= words1.length; i++) {
    res[i][0] = i;
  }
  for (let j = 0; j <= words2.length; j++) {
    res[0][j] = j;
  }
  for (let i = 1; i <= words1.length; i++) {
    for (let j = 1; j <= words2.length; j++) {
      res[i][j] = Math.min(
        res[i - 1][j] + 1,
        res[i][j - 1] + 1,
        res[i - 1][j - 1] +
          (words1[i - 1].toUpperCase() === words2[j - 1].toUpperCase() ? 0 : 1)
      );
    }
  }
  return res[words1.length][words2.length];
};

const characterErrorRate = (
  transcript: string,
  expectedTranscript: string
): number => {
  const ed = levenshteinDistance(
    transcript.split(''),
    expectedTranscript.split('')
  );
  return ed / expectedTranscript.length;
};

const validateMetadata = (
  words: LeopardWord[],
  transcript: string,
  audioLength: number
) => {
  const normTranscript = transcript.toUpperCase();
  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    expect(normTranscript.includes(word.word.toUpperCase())).toBeTruthy();
    expect(word.startSec).toBeGreaterThan(0);
    expect(word.startSec).toBeLessThanOrEqual(word.endSec);
    if (i < (words.length - 1)) {
      const nextWord = words[i + 1];
      expect(word.endSec).toBeLessThanOrEqual(nextWord.startSec);
    }
    expect(word.startSec).toBeLessThan(audioLength);
    expect(word.confidence >= 0 && word.confidence <= 1).toBeTruthy();
  }
};

const loadPcm = (audioFile: string): any => {
  const waveFilePath = getAudioFile(audioFile);
  const waveBuffer = fs.readFileSync(waveFilePath);
  const waveAudioFile = new WaveFile(waveBuffer);

  const pcm: any = waveAudioFile.getSamples(false, Int16Array);
  return pcm;
};

const testLeopardProcess = (
  language: string,
  transcript: string,
  punctuations: string[],
  testPunctuation: boolean,
  errorRate: number,
  audioFile: string
) => {
  const modelPath = getModelPathByLanguage(language);
  const pcm = loadPcm(audioFile);

  let normTranscript = transcript;
  if (!testPunctuation) {
    for (const punctuation of punctuations) {
      normTranscript = normTranscript.replace(new RegExp(`[${punctuation}]`, "g"), '');
    }
  }

  let leopardEngine = new Leopard(ACCESS_KEY, {
    modelPath,
    enableAutomaticPunctuation: testPunctuation,
  });

  let res = leopardEngine.process(pcm);

  expect(
    characterErrorRate(res.transcript, normTranscript) < errorRate
  ).toBeTruthy();
  validateMetadata(
    res.words,
    res.transcript,
    pcm.length / leopardEngine.sampleRate
  );

  leopardEngine.release();
};

const testLeopardProcessFile = (
  language: string,
  transcript: string,
  punctuations: string[],
  testPunctuation: boolean,
  errorRate: number,
  audioFile: string
) => {
  const modelPath = getModelPathByLanguage(language);
  const pcm = loadPcm(audioFile);

  let normTranscript = transcript;
  if (!testPunctuation) {
    for (const punctuation of punctuations) {
      normTranscript = normTranscript.replace(new RegExp(`[${punctuation}]`, "g"), '');
    }
  }

  let leopardEngine = new Leopard(ACCESS_KEY, {
    modelPath,
    enableAutomaticPunctuation: testPunctuation,
  });

  const waveFilePath = getAudioFile(audioFile);
  let res = leopardEngine.processFile(waveFilePath);

  expect(
    characterErrorRate(res.transcript, normTranscript) < errorRate
  ).toBeTruthy();
  validateMetadata(
    res.words,
    res.transcript,
    pcm.length / leopardEngine.sampleRate
  );

  leopardEngine.release();
};

describe('successful processes', () => {
  it.each(TEST_PARAMETERS)(
    'testing process `%p`',
    (
      language: string,
      transcript: string,
      punctuations: string[],
      errorRate: number,
      audioFile: string
    ) => {
      testLeopardProcess(
        language,
        transcript,
        punctuations,
        false,
        errorRate,
        audioFile
      );
    }
  );

  it.each(TEST_PARAMETERS)(
    'testing process `%p` with punctuation',
    (
      language: string,
      transcript: string,
      punctuations: string[],
      errorRate: number,
      audioFile: string
    ) => {
      testLeopardProcess(
        language,
        transcript,
        punctuations,
        true,
        errorRate,
        audioFile
      );
    }
  );

  it.each(TEST_PARAMETERS)(
    'testing process file `%p`',
    (
      language: string,
      transcript: string,
      punctuations: string[],
      errorRate: number,
      audioFile: string
    ) => {
      testLeopardProcessFile(
        language,
        transcript,
        punctuations,
        false,
        errorRate,
        audioFile
      );
    }
  );

  it.each(TEST_PARAMETERS)(
    'testing process file `%p` with punctuation',
    (
      language: string,
      transcript: string,
      punctuations: string[],
      errorRate: number,
      audioFile: string
    ) => {
      testLeopardProcessFile(
        language,
        transcript,
        punctuations,
        true,
        errorRate,
        audioFile
      );
    }
  );
});

describe('Defaults', () => {
  test('Empty AccessKey', () => {
    expect(() => {
      new Leopard('');
    }).toThrow(LeopardInvalidArgumentError);
  });
});

describe('manual paths', () => {
  test('manual library path', () => {
    const libraryPath = getSystemLibraryPath();

    let leopardEngine = new Leopard(ACCESS_KEY, {
      libraryPath: libraryPath,
      enableAutomaticPunctuation: false,
    });

    const waveFilePath = getAudioFile('test.wav');
    let res = leopardEngine.processFile(waveFilePath);

    expect(res.transcript.length).toBeGreaterThan(0);

    leopardEngine.release();
  });
});
