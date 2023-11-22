import { Leopard, LeopardWorker } from '../';
import testData from './test_data.json';

// @ts-ignore
import leopardParams from './leopard_params';
import { PvModel } from '@picovoice/web-utils';
import { LeopardWord } from '../src';
import { LeopardError } from '../src/leopard_errors';

const ACCESS_KEY: string = Cypress.env('ACCESS_KEY');

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

const wordErrorRate = (
  reference: string,
  hypothesis: string,
  useCER = false
): number => {
  const splitter = useCER ? '' : ' ';
  const ed = levenshteinDistance(
    reference.split(splitter),
    hypothesis.split(splitter)
  );
  return ed / reference.length;
};

const validateMetadata = (
  words: LeopardWord[],
  expectedWords: LeopardWord[],
  enableDiarization: boolean
) => {
  expect(words.length).to.be.eq(expectedWords.length);
  for (let i = 0; i < words.length; i += 1) {
    expect(words[i].word).to.be.eq(expectedWords[i].word);
    expect(words[i].startSec).to.be.closeTo(expectedWords[i].startSec, 0.1);
    expect(words[i].endSec).to.be.closeTo(expectedWords[i].endSec, 0.1);
    expect(words[i].confidence).to.be.closeTo(expectedWords[i].confidence, 0.1);
    if (enableDiarization) {
      expect(words[i].speakerTag).to.be.eq(expectedWords[i].speakerTag);
    } else {
      expect(words[i].speakerTag).to.be.eq(-1);
    }
  }
};

const runInitTest = async (
  instance: typeof Leopard | typeof LeopardWorker,
  params: {
    accessKey?: string;
    model?: PvModel;
    expectFailure?: boolean;
  } = {}
) => {
  const {
    accessKey = ACCESS_KEY,
    model = { publicPath: '/test/leopard_params.pv', forceWrite: true },
    expectFailure = false,
  } = params;

  let isFailed = false;

  try {
    const leopard = await instance.create(accessKey, model);
    expect(leopard.sampleRate).to.be.eq(16000);
    expect(typeof leopard.version).to.eq('string');
    expect(leopard.version.length).to.be.greaterThan(0);

    if (leopard instanceof LeopardWorker) {
      leopard.terminate();
    } else {
      await leopard.release();
    }
  } catch (e) {
    if (expectFailure) {
      isFailed = true;
    } else {
      expect(e).to.be.undefined;
    }
  }

  if (expectFailure) {
    expect(isFailed).to.be.true;
  }
};

const runProcTest = async (
  instance: typeof Leopard | typeof LeopardWorker,
  inputPcm: Int16Array,
  expectedTranscript: string,
  expectedErrorRate: number,
  expectedWords: LeopardWord[],
  params: {
    accessKey?: string;
    model?: PvModel;
    enablePunctuation?: boolean;
    enableDiarization?: boolean;
    useCER?: boolean;
  } = {}
) => {
  const {
    accessKey = ACCESS_KEY,
    model = { publicPath: '/test/leopard_params.pv', forceWrite: true },
    enablePunctuation = false,
    enableDiarization = false,
    useCER = false,
  } = params;

  try {
    const leopard = await instance.create(accessKey, model, {
      enableAutomaticPunctuation: enablePunctuation,
      enableDiarization: enableDiarization,
    });

    const { transcript, words } = await leopard.process(inputPcm);
    const errorRate = wordErrorRate(expectedTranscript, transcript, useCER);
    expect(errorRate).to.be.lt(expectedErrorRate);

    validateMetadata(words, expectedWords, enableDiarization);

    if (leopard instanceof LeopardWorker) {
      leopard.terminate();
    } else {
      await leopard.release();
    }
  } catch (e) {
    expect(e).to.be.undefined;
  }
};

describe('Leopard Binding', function () {
  it(`should return process error message stack`, async () => {
    let error: LeopardError | null = null;

    const leopard = await Leopard.create(ACCESS_KEY, {
      publicPath: '/test/leopard_params.pv',
      forceWrite: true,
    });
    const testPcm = new Int16Array(512);
    // @ts-ignore
    const objectAddress = leopard._objectAddress;

    // @ts-ignore
    leopard._objectAddress = 0;

    try {
      await leopard.process(testPcm);
    } catch (e) {
      error = e as LeopardError;
    }

    // @ts-ignore
    leopard._objectAddress = objectAddress;
    await leopard.release();

    expect(error).to.not.be.null;
    if (error) {
      expect((error as LeopardError).messageStack.length).to.be.gt(0);
      expect((error as LeopardError).messageStack.length).to.be.lte(8);
    }
  });

  for (const instance of [Leopard, LeopardWorker]) {
    const instanceString = instance === LeopardWorker ? 'worker' : 'main';

    it(`should return correct error message stack (${instanceString})`, async () => {
      let messageStack = [];
      try {
        const leopard = await instance.create('invalidAccessKey', {
          publicPath: '/test/leopard_params.pv',
          forceWrite: true,
        });
        expect(leopard).to.be.undefined;
      } catch (e: any) {
        messageStack = e.messageStack;
      }

      expect(messageStack.length).to.be.gt(0);
      expect(messageStack.length).to.be.lte(8);

      try {
        const leopard = await instance.create('invalidAccessKey', {
          publicPath: '/test/leopard_params.pv',
          forceWrite: true,
        });
        expect(leopard).to.be.undefined;
      } catch (e: any) {
        expect(messageStack.length).to.be.eq(e.messageStack.length);
      }
    });

    it(`should be able to init with public path (${instanceString})`, () => {
      cy.wrap(null).then(async () => {
        await runInitTest(instance);
      });
    });

    it(`should be able to init with base64 (${instanceString})`, () => {
      cy.wrap(null).then(async () => {
        await runInitTest(instance, {
          model: { base64: leopardParams, forceWrite: true },
        });
      });
    });

    it(`should be able to handle UTF-8 public path (${instanceString})`, () => {
      cy.wrap(null).then(async () => {
        await runInitTest(instance, {
          model: {
            publicPath: '/test/leopard_params.pv',
            forceWrite: true,
            customWritePath: '테스트',
          },
        });
      });
    });

    it(`should be able to handle invalid public path (${instanceString})`, () => {
      cy.wrap(null).then(async () => {
        await runInitTest(instance, {
          model: { publicPath: 'invalid', forceWrite: true },
          expectFailure: true,
        });
      });
    });

    it(`should be able to handle invalid base64 (${instanceString})`, () => {
      cy.wrap(null).then(async () => {
        await runInitTest(instance, {
          model: { base64: 'invalid', forceWrite: true },
          expectFailure: true,
        });
      });
    });

    it(`should be able to handle invalid access key (${instanceString})`, () => {
      cy.wrap(null).then(async () => {
        await runInitTest(instance, {
          accessKey: 'invalid',
          expectFailure: true,
        });
      });
    });

    for (const testParam of testData.tests.language_tests) {
      it(`should be able to process (${testParam.language}) (${instanceString})`, () => {
        try {
          cy.getFramesFromFile(`audio_samples/${testParam.audio_file}`).then(
            async pcm => {
              const suffix =
                testParam.language === 'en' ? '' : `_${testParam.language}`;
              await runProcTest(
                instance,
                pcm,
                testParam.transcript,
                testParam.error_rate,
                testParam.words.map((w: any) => ({
                  word: w.word,
                  startSec: w.start_sec,
                  endSec: w.end_sec,
                  confidence: w.confidence,
                  speakerTag: w.speaker_tag,
                })),
                {
                  model: {
                    publicPath: `/test/leopard_params${suffix}.pv`,
                    forceWrite: true,
                  },
                  useCER: testParam.language === 'ja',
                }
              );
            }
          );
        } catch (e) {
          expect(e).to.be.undefined;
        }
      });

      it(`should be able to process with punctuation (${testParam.language}) (${instanceString})`, () => {
        try {
          cy.getFramesFromFile(`audio_samples/${testParam.audio_file}`).then(
            async pcm => {
              const suffix =
                testParam.language === 'en' ? '' : `_${testParam.language}`;
              await runProcTest(
                instance,
                pcm,
                testParam.transcript_with_punctuation,
                testParam.error_rate,
                testParam.words.map((w: any) => ({
                  word: w.word,
                  startSec: w.start_sec,
                  endSec: w.end_sec,
                  confidence: w.confidence,
                  speakerTag: w.speaker_tag,
                })),
                {
                  model: {
                    publicPath: `/test/leopard_params${suffix}.pv`,
                    forceWrite: true,
                  },
                  enablePunctuation: true,
                  useCER: testParam.language === 'ja',
                }
              );
            }
          );
        } catch (e) {
          expect(e).to.be.undefined;
        }
      });

      it(`should be able to process with diarization (${testParam.language}) (${instanceString})`, () => {
        try {
          cy.getFramesFromFile(`audio_samples/${testParam.audio_file}`).then(
            async pcm => {
              const suffix =
                testParam.language === 'en' ? '' : `_${testParam.language}`;
              await runProcTest(
                instance,
                pcm,
                testParam.transcript,
                testParam.error_rate,
                testParam.words.map((w: any) => ({
                  word: w.word,
                  startSec: w.start_sec,
                  endSec: w.end_sec,
                  confidence: w.confidence,
                  speakerTag: w.speaker_tag,
                })),
                {
                  model: {
                    publicPath: `/test/leopard_params${suffix}.pv`,
                    forceWrite: true,
                  },
                  enableDiarization: true,
                  useCER: testParam.language === 'ja',
                }
              );
            }
          );
        } catch (e) {
          expect(e).to.be.undefined;
        }
      });
    }

    for (const testParam of testData.tests.diarization_tests) {
      it(`should be able to process diarization multiple speakers (${testParam.language}) (${instanceString})`, () => {
        try {
          cy.getFramesFromFile(`audio_samples/${testParam.audio_file}`).then(
            async pcm => {
              const suffix =
                testParam.language === 'en' ? '' : `_${testParam.language}`;

              const leopard = await instance.create(
                ACCESS_KEY,
                {
                  publicPath: `/test/leopard_params${suffix}.pv`,
                  forceWrite: true,
                },
                {
                  enableDiarization: true,
                }
              );

              const { words } = await leopard.process(pcm);

              expect(words.length).to.eq(testParam.words.length);

              for (let i = 0; i < words.length; i++) {
                expect(words[i].word).to.eq(testParam.words[i].word);
                expect(words[i].speakerTag).to.eq(
                  testParam.words[i].speaker_tag
                );
              }

              if (leopard instanceof Leopard) {
                await leopard.release();
              } else {
                leopard.terminate();
              }
            }
          );
        } catch (e) {
          expect(e).to.be.undefined;
        }
      });
    }

    it(`should be able to transfer buffer`, () => {
      try {
        cy.getFramesFromFile(`audio_samples/test.wav`).then(async pcm => {
          const leopard = await LeopardWorker.create(
            ACCESS_KEY,
            { publicPath: '/test/leopard_params.pv', forceWrite: true },
            { enableAutomaticPunctuation: false }
          );

          let copy = new Int16Array(pcm.length);
          copy.set(pcm);
          await leopard.process(copy, {
            transfer: true,
            transferCallback: data => {
              copy = data;
            },
          });
          leopard.terminate();

          expect(copy).to.deep.eq(pcm);
        });
      } catch (e) {
        expect(e).to.be.undefined;
      }
    });
  }
});
