const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const testData = require('../../../resources/.test/test_data.json');

const availableLanguages = testData.tests.language_tests.map((x) => x.language);

const commands = process.argv.slice(2, -1);
const language = process.argv.slice(-1)[0];

if (!availableLanguages.includes(language)) {
  console.error(
    `Choose the language you would like to run the demo in with "yarn [android/ios]-run [language]".
Available languages are ${availableLanguages.join(', ')}`,
  );
  process.exit(1);
}

const suffix = language === 'en' ? '' : `_${language}`;
const rootDir = path.join(__dirname, '..', '..', '..');

const modelDir = path.join(rootDir, 'lib', 'common');

const androidAssetDir = path.join(
  __dirname,
  '..',
  'android',
  'leopard-rn-demo-app',
  'src',
  'main',
  'assets',
);

const iosBundleDir = path.join(__dirname, '..', 'ios', 'LeopardDemo');

fs.rmSync(path.join(androidAssetDir, 'models'), {
  recursive: true,
  force: true,
});
fs.rmSync(path.join(iosBundleDir, 'models'), { recursive: true, force: true });

fs.mkdirSync(path.join(androidAssetDir, 'models'), { recursive: true });
fs.mkdirSync(path.join(iosBundleDir, 'models'), { recursive: true });

let params = {
  language: language,
};

fs.copyFileSync(
  path.join(modelDir, `leopard_params${suffix}.pv`),
  path.join(androidAssetDir, 'models', `leopard_params${suffix}.pv`),
);

fs.copyFileSync(
  path.join(modelDir, `leopard_params${suffix}.pv`),
  path.join(iosBundleDir, 'models', `leopard_params${suffix}.pv`),
);

fs.writeFileSync(
  path.join(__dirname, '..', 'params.json'),
  JSON.stringify(params),
);

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';

child_process.fork('react-native', commands, {
  execPath: command,
});
