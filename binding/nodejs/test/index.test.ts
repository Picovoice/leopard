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
  getLanguageTestParameters,
  getDiarizationTestParameters,
} from './test_utils';

const LANGUAGE_TEST_PARAMETERS = getLanguageTestParameters();
const DIARIZATION_TEST_PARAMETERS = getDiarizationTestParameters();

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
  referenceWords: LeopardWord[],
  enableDiarization: boolean
) => {
  expect(words.length).toEqual(referenceWords.length);
  for (let i = 0; i < words.length; i += 1) {
    expect(words[i].word).toEqual(referenceWords[i].word);
    expect(words[i].startSec).toBeCloseTo(referenceWords[i].startSec, 1);
    expect(words[i].endSec).toBeCloseTo(referenceWords[i].endSec, 1);
    expect(words[i].confidence).toBeCloseTo(referenceWords[i].confidence, 1);
    if (enableDiarization) {
      expect(words[i].speakerTag).toEqual(referenceWords[i].speakerTag);
    } else {
      expect(words[i].speakerTag).toEqual(-1);
    }
  }
};

const loadPcm = (audioFile: string): any => {
  const waveFilePath = getAudioFile(audioFile);
  const waveBuffer = fs.readFileSync(waveFilePath);
  const waveAudioFile = new WaveFile(waveBuffer);

  return waveAudioFile.getSamples(false, Int16Array);
};

const testLeopardProcess = (
  language: string,
  transcript: string,
  enableAutomaticPunctuation: boolean,
  enableDiarization: boolean,
  errorRate: number,
  audioFile: string,
  words: LeopardWord[]
) => {
  const modelPath = getModelPathByLanguage(language);
  const pcm = loadPcm(audioFile);

  let leopardEngine = new Leopard(ACCESS_KEY, {
    modelPath,
    enableAutomaticPunctuation,
    enableDiarization,
  });

  let res = leopardEngine.process(pcm);

  expect(
    characterErrorRate(res.transcript, transcript) < errorRate
  ).toBeTruthy();
  validateMetadata(res.words, words, enableDiarization);

  leopardEngine.release();
};

const testLeopardProcessFile = (
  language: string,
  transcript: string,
  enableAutomaticPunctuation: boolean,
  enableDiarization: boolean,
  errorRate: number,
  audioFile: string,
  words: LeopardWord[]
) => {
  const modelPath = getModelPathByLanguage(language);

  let leopardEngine = new Leopard(ACCESS_KEY, {
    modelPath,
    enableAutomaticPunctuation,
    enableDiarization,
  });

  const waveFilePath = getAudioFile(audioFile);
  let res = leopardEngine.processFile(waveFilePath);

  expect(
    characterErrorRate(res.transcript, transcript) < errorRate
  ).toBeTruthy();
  validateMetadata(res.words, words, enableDiarization);

  leopardEngine.release();
};

describe('successful processes', () => {
  it.each(LANGUAGE_TEST_PARAMETERS)(
    'testing process `%p`',
    (
      language: string,
      transcript: string,
      _: string,
      errorRate: number,
      audioFile: string,
      words: LeopardWord[]
    ) => {
      testLeopardProcess(
        language,
        transcript,
        false,
        false,
        errorRate,
        audioFile,
        words
      );
    }
  );

  it.each(LANGUAGE_TEST_PARAMETERS)(
    'testing process file `%p`',
    (
      language: string,
      transcript: string,
      _: string,
      errorRate: number,
      audioFile: string,
      words: LeopardWord[]
    ) => {
      testLeopardProcessFile(
        language,
        transcript,
        false,
        false,
        errorRate,
        audioFile,
        words
      );
    }
  );

  it.each(LANGUAGE_TEST_PARAMETERS)(
    'testing process file `%p` with punctuation',
    (
      language: string,
      _: string,
      transcript: string,
      errorRate: number,
      audioFile: string,
      words: LeopardWord[]
    ) => {
      testLeopardProcessFile(
        language,
        transcript,
        true,
        false,
        errorRate,
        audioFile,
        words
      );
    }
  );
  it.each(LANGUAGE_TEST_PARAMETERS)(
    'testing process file `%p` with diarization',
    (
      language: string,
      transcript: string,
      _: string,
      errorRate: number,
      audioFile: string,
      words: LeopardWord[]
    ) => {
      testLeopardProcessFile(
        language,
        transcript,
        false,
        true,
        errorRate,
        audioFile,
        words
      );
    }
  );
});

describe('successful diarization', () => {
  it.each(DIARIZATION_TEST_PARAMETERS)(
    'testing diarization `%p`',
    (language: string, audioFile: string, referenceWords: LeopardWord[]) => {
      const modelPath = getModelPathByLanguage(language);

      let leopardEngine = new Leopard(ACCESS_KEY, {
        modelPath,
        enableDiarization: true,
      });

      const waveFilePath = getAudioFile(audioFile);
      let words = leopardEngine.processFile(waveFilePath).words;

      expect(words.length).toEqual(referenceWords.length);
      for (let i = 0; i < words.length; i += 1) {
        expect(words[i].word).toEqual(referenceWords[i].word);
        expect(words[i].speakerTag).toEqual(referenceWords[i].speakerTag);
      }

      leopardEngine.release();
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

describe('error message stack', () => {
  test('message stack cleared after read', () => {
    let error: string[] = [];
    try {
      new Leopard('invalid');
    } catch (e: any) {
      error = e.messageStack;
    }

    expect(error.length).toBeGreaterThan(0);
    expect(error.length).toBeLessThanOrEqual(8);

    try {
      new Leopard('invalid');
    } catch (e: any) {
      for (let i = 0; i < error.length; i++) {
        expect(error[i]).toEqual(e.messageStack[i]);
      }
    }
  });
});
