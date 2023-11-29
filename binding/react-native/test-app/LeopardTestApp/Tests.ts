import {Platform} from 'react-native';
import fs from 'react-native-fs';
import {decode as atob} from 'base-64';

import {Leopard, LeopardWord} from '@picovoice/leopard-react-native';

const testData = require('./test_data.json');
const platform = Platform.OS;

const TEST_ACCESS_KEY: string = '{TESTING_ACCESS_KEY_HERE}';

export type Result = {
  testName: string;
  success: boolean;
  errorString?: string;
};

type TestWord = {
  word: string;
  start_sec: number;
  end_sec: number;
  confidence: number;
  speaker_tag: number;
};

const levenshteinDistance = (words1: string[], words2: string[]) => {
  const res = Array.from(
    Array(words1.length + 1),
    () => new Array(words2.length + 1),
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
          (words1[i - 1].toUpperCase() === words2[j - 1].toUpperCase() ? 0 : 1),
      );
    }
  }
  return res[words1.length][words2.length];
};

const wordErrorRate = (
  reference: string,
  hypothesis: string,
  useCER = false,
): number => {
  const splitter = useCER ? '' : ' ';
  const ed = levenshteinDistance(
    reference.split(splitter),
    hypothesis.split(splitter),
  );
  return ed / reference.length;
};

const validateMetadata = (
  words: LeopardWord[],
  expectedWords: TestWord[],
  enableDiarization: boolean,
): string | null => {
  if (words.length !== expectedWords.length) {
    return `Length ${words.length} does not match ${expectedWords.length}`;
  }
  for (let i = 0; i < words.length; i++) {
    if (words[i].word !== expectedWords[i].word) {
      return `Word ${words[i].word} is not equal to ${expectedWords[i].word}`;
    }
    if (Math.abs(words[i].startSec - expectedWords[i].start_sec) > 0.01) {
      return `Start sec ${words[i].startSec} is not equal to ${expectedWords[i].start_sec}`;
    }
    if (Math.abs(words[i].endSec - expectedWords[i].end_sec) > 0.01) {
      return `End sec ${words[i].endSec} is not equal to ${expectedWords[i].end_sec}`;
    }
    if (Math.abs(words[i].confidence - expectedWords[i].confidence) > 0.01) {
      return `Confidence ${words[i].confidence} is not equal to ${expectedWords[i].confidence}`;
    }
    if (enableDiarization) {
      if (words[i].speakerTag !== expectedWords[i].speaker_tag) {
        return `Speaker ${words[i].speakerTag} is not equal to ${expectedWords[i].speaker_tag}`;
      }
    } else {
      if (words[i].speakerTag !== -1) {
        return `Invalid speaker tag ${words[i].speakerTag}`;
      }
    }
  }
  return null;
};

function logResult(result: Result) {
  if (result.success) {
    console.info(result);
  } else {
    console.error(result);
  }
}

function getPath(filePath: string) {
  if (platform === 'ios') {
    return `Assets.bundle/${filePath}`;
  }
  return filePath;
}

async function absolutePath(subdirectory: string, fileName: string) {
  if (platform === 'ios') {
    const path = getPath(`${subdirectory}/${fileName}`);
    return `${fs.MainBundlePath}/${path}`;
  } else {
    const writePath = `${fs.TemporaryDirectoryPath}/${subdirectory}/${fileName}`;
    await fs.mkdir(`${fs.TemporaryDirectoryPath}/${subdirectory}`);
    await fs.copyFileAssets(`${subdirectory}/${fileName}`, writePath);
    return writePath;
  }
}

async function getBinaryFile(audioFilePath: string) {
  let fileBase64;
  if (platform === 'ios') {
    fileBase64 = await fs.readFile(
      `${fs.MainBundlePath}/${audioFilePath}`,
      'base64',
    );
  } else {
    fileBase64 = await fs.readFileAssets(audioFilePath, 'base64');
  }
  const fileBinary = atob(fileBase64);

  const bytes = new Uint8Array(fileBinary.length);
  for (let i = 0; i < fileBinary.length; i++) {
    bytes[i] = fileBinary.charCodeAt(i);
  }
  return bytes;
}

async function getPcmFromFile(
  audioFilePath: string,
  expectedSampleRate: number,
) {
  const headerSampleRateOffset = 24;
  const headerOffset = 44;

  const fileBytes = await getBinaryFile(audioFilePath);
  const dataView = new DataView(fileBytes.buffer);

  const fileSampleRate = dataView.getInt32(headerSampleRateOffset, true);
  if (fileSampleRate !== expectedSampleRate) {
    throw new Error(
      `Specified sample rate did not match test file: '${fileSampleRate}' != '${expectedSampleRate}'`,
    );
  }

  const pcm: number[] = [];
  for (let i = headerOffset; i < fileBytes.length; i += 2) {
    pcm.push(dataView.getInt16(i, true));
  }

  return pcm;
}

async function runInitTestCase(
  params: {
    accessKey?: string;
    modelPath?: string;
    expectFailure?: boolean;
  } = {},
) {
  const {
    accessKey = TEST_ACCESS_KEY,
    modelPath = getPath('model_files/leopard_params.pv'),
    expectFailure = false,
  } = params;

  const result: Result = {testName: '', success: true};

  let isFailed = false;
  try {
    const leopard = await Leopard.create(accessKey, modelPath);
    if (leopard.sampleRate !== 16000) {
      result.success = false;
      result.errorString = `Invalid sample rate: '${leopard.sampleRate}'`;
    } else if (typeof leopard.version !== 'string') {
      result.success = false;
      result.errorString = `Invalid version: '${leopard.version}'`;
    } else if (leopard.version.length === 0) {
      result.success = false;
      result.errorString = 'Invalid version length.';
    }

    await leopard.delete();
  } catch (e) {
    if (expectFailure) {
      isFailed = true;
    } else {
      result.success = false;
      result.errorString = `Failed to initialize leopard with:  '${e}'`;
    }
  }

  if (expectFailure && !isFailed) {
    result.success = false;
    result.errorString = 'Expected init to fail but succeeded.';
  }

  return result;
}

async function runProcTestCase(
  language: string,
  audioFile: string,
  expectedTranscript: string,
  expectedWords: TestWord[],
  errorRate: number,
  params: {
    asFile?: boolean;
    enablePunctuation?: boolean;
    enableDiarization?: boolean;
  } = {},
): Promise<Result> {
  const {
    asFile = false,
    enablePunctuation = false,
    enableDiarization = false,
  } = params;

  const result: Result = {testName: '', success: false};

  try {
    const modelPath =
      language === 'en'
        ? getPath('model_files/leopard_params.pv')
        : getPath(`model_files/leopard_params_${language}.pv`);
    const audioPath = getPath(`audio_samples/${audioFile}`);

    const leopard = await Leopard.create(TEST_ACCESS_KEY, modelPath, {
      enableAutomaticPunctuation: enablePunctuation,
      enableDiarization: enableDiarization
    });

    const pcm = await getPcmFromFile(audioPath, leopard.sampleRate);

    const {transcript, words} = await (asFile
      ? leopard.processFile(await absolutePath('audio_samples', audioFile))
      : leopard.process(pcm));

    await leopard.delete();

    const wer = wordErrorRate(
      transcript,
      expectedTranscript,
      language === 'ja',
    );
    if (wer > errorRate) {
      result.errorString = `Expected WER '${wer}' to be less than '${errorRate}'`;
      return result;
    }

    const errorMessage = validateMetadata(words, expectedWords, enableDiarization);
    if (errorMessage) {
      result.errorString = errorMessage;
      return result;
    }

    result.success = true;
  } catch (e) {
    result.errorString = `Failed to process leopard with: ${e}`;
  }

  return result;
}

async function initTests(): Promise<Result[]> {
  const results: Result[] = [];

  let result = await runInitTestCase({
    accessKey: 'invalid',
    expectFailure: true,
  });
  result.testName = 'Invalid access key test';
  logResult(result);
  results.push(result);

  result = await runInitTestCase({
    modelPath: 'invalid',
    expectFailure: true,
  });
  result.testName = 'Invalid model path';
  logResult(result);
  results.push(result);

  return results;
}

async function languageTests(): Promise<Result[]> {
  const results: Result[] = [];

  for (const testParam of testData.tests.language_tests) {
    const result = await runProcTestCase(
      testParam.language,
      testParam.audio_file,
      testParam.transcript,
      testParam.words,
      testParam.error_rate,
    );
    result.testName = `Process test for '${testParam.language}'`;
    logResult(result);
    results.push(result);
  }

  for (const testParam of testData.tests.language_tests) {
    const result = await runProcTestCase(
      testParam.language,
      testParam.audio_file,
      testParam.transcript_with_punctuation,
      testParam.words,
      testParam.error_rate,
      {
        enablePunctuation: true,
      },
    );
    result.testName = `Process test with punctuation for '${testParam.language}'`;
    logResult(result);
    results.push(result);
  }

  for (const testParam of testData.tests.language_tests) {
    const result = await runProcTestCase(
      testParam.language,
      testParam.audio_file,
      testParam.transcript,
      testParam.words,
      testParam.error_rate,
      {
        asFile: true,
      },
    );
    result.testName = `Process file test for '${testParam.language}'`;
    logResult(result);
    results.push(result);
  }

  for (const testParam of testData.tests.language_tests) {
    const result = await runProcTestCase(
      testParam.language,
      testParam.audio_file,
      testParam.transcript,
      testParam.words,
      testParam.error_rate,
      {
        enableDiarization: true,
      },
    );
    result.testName = `Process test with diarization for '${testParam.language}'`;
    logResult(result);
    results.push(result);
  }

  return results;
}

async function diarizationTests(): Promise<Result[]> {
  const results: Result[] = [];

  for (const testParam of testData.tests.diarization_tests) {
    const result: Result = {testName: '', success: false};

    const { language, audio_file, words: expectedWords } = testParam;

    try {
      const modelPath =
        language === 'en'
          ? getPath('model_files/leopard_params.pv')
          : getPath(`model_files/leopard_params_${language}.pv`);

      const leopard = await Leopard.create(TEST_ACCESS_KEY, modelPath, {
        enableDiarization: true
      });
      
      const { words } = await leopard.processFile(await absolutePath('audio_samples', audio_file));
      await leopard.delete();

      let errorMessage: string | null = null;
      if (words.length !== expectedWords.length) {
        errorMessage = `Length ${words.length} does not match ${expectedWords.length}`;
      }
      for (let i = 0; i < words.length; i++) {
        if (words[i].word !== expectedWords[i].word) {
          errorMessage = `Word ${words[i].word} is not equal to ${expectedWords[i].word}`;
          break;
        }
        if (words[i].speakerTag !== expectedWords[i].speaker_tag) {
          errorMessage = `Speaker ${words[i].speakerTag} is not equal to ${expectedWords[i].speaker_tag}`;
          break;
        }
      }

      if (errorMessage) {
        result.errorString = errorMessage;
      } else {
        result.success = true;
      }
    } catch (e) {
      result.errorString = `Failed to process leopard with: ${e}`;
    }

    result.testName = `Diarization multiple speaker test for '${testParam.language}'`;
    logResult(result);
    results.push(result);
  }

  return results;
}

export async function runLeopardTests(): Promise<Result[]> {
  const initResults = await initTests();
  const languageResults = await languageTests();
  const diarizationResults = await diarizationTests();
  return [...initResults, ...languageResults, ...diarizationResults];
}
