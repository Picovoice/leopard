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
  transcript: string,
  audioLength: number,
): string | null => {
  const normTranscript = transcript.toUpperCase();
  for (let i = 0; i < words.length; i++) {
    if (!normTranscript.includes(words[i].word.toUpperCase())) {
      return `${words[i].word} is not in transcript.`;
    }
    if (words[i].startSec <= 0) {
      return `${words[i].word} has invalid startSec: '${words[i].startSec}'`;
    }
    if (words[i].startSec > words[i].endSec) {
      return `${words[i].word} invalid meta: startSec '${words[i].startSec}' > endSec '${words[i].endSec}`;
    }
    if (i < words.length - 1) {
      if (words[i].endSec > words[i + 1].startSec) {
        return `${words[i].word} invalid meta: endSec '${words[i].endSec}'
        is greater than next word startSec
        '${words[i + 1].word} - ${words[i + 1].startSec}'`;
      }
    } else {
      if (words[i].endSec > audioLength) {
        return `${words[i].word} invalid meta: endSec '${words[i].endSec}' is greater than audio length '${audioLength}'`;
      }
    }
    if (!(words[i].confidence >= 0 || words[i].confidence <= 1)) {
      return `${words[i].word} invalid meta: invalid confidence value '${words[i].confidence}'`;
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
    return `${fs.MainBundlePath}/${subdirectory}/${fileName}`;
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
  punctuations: string[],
  errorRate: number,
  params: {
    asFile?: boolean;
    enablePunctuation?: boolean;
  } = {},
): Promise<Result> {
  const {asFile = false, enablePunctuation = false} = params;

  const result: Result = {testName: '', success: false};

  try {
    const modelPath =
      language === 'en'
        ? getPath('model_files/leopard_params.pv')
        : getPath(`model_files/leopard_params_${language}.pv`);
    const audioPath = getPath(`audio_samples/${audioFile}`);

    const leopard = await Leopard.create(TEST_ACCESS_KEY, modelPath, {
      enableAutomaticPunctuation: enablePunctuation,
    });

    const pcm = await getPcmFromFile(audioPath, leopard.sampleRate);

    const {transcript, words} = await (asFile
      ? leopard.processFile(await absolutePath('audio_samples', audioFile))
      : leopard.process(pcm));

    await leopard.delete();

    let normalizedTranscript = expectedTranscript;
    if (!enablePunctuation) {
      for (const punctuation of punctuations) {
        normalizedTranscript = normalizedTranscript.replace(punctuation, '');
      }
    }

    const wer = wordErrorRate(
      transcript,
      normalizedTranscript,
      language === 'ja',
    );
    if (wer > errorRate) {
      result.errorString = `Expected WER '${wer}' to be less than '${errorRate}'`;
      return result;
    }

    const errorMessage = validateMetadata(words, transcript, pcm.length);
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

async function paramTests(): Promise<Result[]> {
  const results: Result[] = [];

  for (const testParam of testData.tests.parameters) {
    const result = await runProcTestCase(
      testParam.language,
      testParam.audio_file,
      testParam.transcript,
      testParam.punctuations,
      testParam.error_rate,
    );
    result.testName = `Process test for '${testParam.language}'`;
    logResult(result);
    results.push(result);
  }

  for (const testParam of testData.tests.parameters) {
    const result = await runProcTestCase(
      testParam.language,
      testParam.audio_file,
      testParam.transcript,
      testParam.punctuations,
      testParam.error_rate,
      {
        enablePunctuation: true,
      },
    );
    result.testName = `Process test with punctuation for '${testParam.language}'`;
    logResult(result);
    results.push(result);
  }

  for (const testParam of testData.tests.parameters) {
    const result = await runProcTestCase(
      testParam.language,
      testParam.audio_file,
      testParam.transcript,
      testParam.punctuations,
      testParam.error_rate,
      {
        asFile: true,
      },
    );
    result.testName = `Process file test for '${testParam.language}'`;
    logResult(result);
    results.push(result);
  }

  return results;
}

export async function runLeopardTests(): Promise<Result[]> {
  const initResults = await initTests();
  const paramResults = await paramTests();
  return [...initResults, ...paramResults];
}
