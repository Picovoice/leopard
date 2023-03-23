import * as path from 'path';

const ROOT_DIR = path.join(__dirname, '../../..');
const TEST_DATA_JSON = require(path.join(
  ROOT_DIR,
  'resources/test/test_data.json'
));

function appendLanguage(s: string, language: string): string {
  if (language === 'en') {
    return s;
  }
  return s + '_' + language;
}

export function getModelPathByLanguage(language: string): string {
  return path.join(
    ROOT_DIR,
    `${appendLanguage('lib/common/leopard_params', language)}.pv`
  );
}

export function getAudioFile(audioFile: string): string {
  return path.join(ROOT_DIR, 'resources/audio_samples', audioFile);
}

export function getTestParameters(): [
  string,
  string,
  string[],
  number,
  string
][] {
  let parametersJson = TEST_DATA_JSON.tests.parameters;
  return parametersJson.map((x: any) => [
    x.language,
    x.transcript,
    x.punctuations,
    x.error_rate,
    x.audio_file,
  ]);
}
