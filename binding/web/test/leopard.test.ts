import { Leopard, LeopardWorker } from "../";
import testData from "./test_data.json";

// @ts-ignore
import leopardParams from "./leopard_params";
import { PvModel } from '@picovoice/web-utils';

const ACCESS_KEY: string = Cypress.env("ACCESS_KEY");

const editDistance = (words1: string[], words2: string[]) => {
  const res = Array.from(Array(words2.length + 1), () => new Array(words1.length + 1));
  for (let i = 0; i <= words1.length; i++) {
    res[0][i] = i;
  }
  for (let j = 0; j <= words2.length; j++) {
    res[j][0] = j;
  }
  for (let j = 1; j <= words2.length; j ++) {
    for (let i = 1; i <= words1.length; i ++) {
      res[j][i] = Math.min(
        res[j][i - 1] + 1,
        res[j - 1][i] + 1,
        res[j - 1][i - 1] + (words1[i - 1].toUpperCase() === words2[j - 1].toUpperCase() ? 0 : 1),
      );
    }
  }
  return res[words2.length][words1.length];
};

const wordErrorRate = (reference: string, hypothesis: string, useCER = false): number => {
  const splitter = (useCER) ? '' : ' ';
  const ed = editDistance(reference.split(splitter), hypothesis.split(splitter));
  return ed / reference.length;
};

const runInitTest = async (
  instance: typeof Leopard | typeof LeopardWorker,
  params: {
    accessKey?: string,
    model?: PvModel,
    expectFailure?: boolean,
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
  punctuations: string[],
  expectedTranscript: string,
  expectedErrorRate: number,
  params: {
    accessKey?: string,
    model?: PvModel,
    enablePunctuation?: boolean,
    useCER?: boolean,
  } = {}
) => {
  const {
    accessKey = ACCESS_KEY,
    model = { publicPath: '/test/leopard_params.pv', forceWrite: true },
    enablePunctuation = true,
    useCER = false
  } = params;

  let normalizedTranscript = expectedTranscript;
  if (!enablePunctuation) {
    for (const punctuation of punctuations) {
      normalizedTranscript = normalizedTranscript.replaceAll(punctuation, '');
    }
  }

  try {
    const leopard = await instance.create(accessKey, model, {
      enableAutomaticPunctuation: enablePunctuation
    });

    const { transcript, words } = await leopard.process(inputPcm);
    const errorRate = wordErrorRate(normalizedTranscript, transcript, useCER);
    expect(errorRate).to.be.lt(expectedErrorRate);

    let transcriptReducer = normalizedTranscript;
    if (enablePunctuation) {
      for (const punctuation of punctuations) {
        transcriptReducer = transcriptReducer.replace(punctuation, "");
      }
    }
    for (let i = 0; i < words.length; i++) {
      expect(transcriptReducer.slice(0, words[i].word.length).toUpperCase()).to.be.eq(words[i].word.toUpperCase());
      expect(words[i].startSec).to.be.gt(0);
      expect(words[i].startSec).to.be.lte(words[i].endSec);
      if (i < words.length - 1) {
        expect(words[i].endSec).to.be.lte(words[i + 1].startSec);
      } else {
        expect(words[i].endSec).to.be.lte(inputPcm.length / leopard.sampleRate);
      }
      expect(words[i].confidence).to.be.gte(0);
      expect(words[i].confidence).to.be.lte(1);

      transcriptReducer = transcriptReducer.slice(words[i].word.length).trim();
    }

    if (leopard instanceof LeopardWorker) {
      leopard.terminate();
    } else {
      await leopard.release();
    }
  } catch (e) {
    expect(e).to.be.undefined;
  }
};

describe("Leopard Binding", function () {
  for (const instance of [Leopard, LeopardWorker]) {
    const instanceString = (instance === LeopardWorker) ? 'worker' : 'main';

    it(`should be able to init with public path (${instanceString})`, () => {
      cy.wrap(null).then(async () => {
        await runInitTest(instance);
      });
    });

    it(`should be able to init with base64 (${instanceString})`, () => {
      cy.wrap(null).then(async () => {
        await runInitTest(instance, {
          model: { base64: leopardParams, forceWrite: true }
        });
      });
    });

    it(`should be able to handle UTF-8 public path (${instanceString})`, () => {
      cy.wrap(null).then(async () => {
        await runInitTest(instance, {
          model: { publicPath: '/test/leopard_params.pv', forceWrite: true, customWritePath: '테스트' }
        });
      });
    });

    it(`should be able to handle invalid public path (${instanceString})`, () => {
      cy.wrap(null).then(async () => {
        await runInitTest(instance, {
          model: { publicPath: 'invalid', forceWrite: true },
          expectFailure: true
        });
      });
    });

    it(`should be able to handle invalid base64 (${instanceString})`, () => {
      cy.wrap(null).then(async () => {
        await runInitTest(instance, {
          model: { base64: 'invalid', forceWrite: true },
          expectFailure: true
        });
      });
    });

    it(`should be able to handle invalid access key (${instanceString})`, () => {
      cy.wrap(null).then(async () => {
        await runInitTest(instance, {
          accessKey: 'invalid',
          expectFailure: true
        });
      });
    });

    for (const testParam of testData.tests.parameters) {
      it(`should be able to process (${testParam.language}) (${instanceString})`, () => {
        try {
          cy.getFramesFromFile(`audio_samples/${testParam.audio_file}`).then( async pcm => {
            const suffix = (testParam.language === 'en') ? '' : `_${testParam.language}`;
            await runProcTest(
              instance,
              pcm,
              testParam.punctuations,
              testParam.transcript,
              testParam.error_rate,
              {
                model: { publicPath: `/test/leopard_params${suffix}.pv`, forceWrite: true },
                enablePunctuation: false,
                useCER: (testParam.language === 'ja')
              });
          });
        } catch (e) {
          expect(e).to.be.undefined;
        }
      });

      it(`should be able to process with punctuation (${testParam.language}) (${instanceString})`, () => {
        try {
          cy.getFramesFromFile(`audio_samples/${testParam.audio_file}`).then( async pcm => {
            const suffix = (testParam.language === 'en') ? '' : `_${testParam.language}`;
            await runProcTest(
              instance,
              pcm,
              testParam.punctuations,
              testParam.transcript,
              testParam.error_rate,
              {
                model: { publicPath: `/test/leopard_params${suffix}.pv`, forceWrite: true },
                useCER: (testParam.language === 'ja')
              });
          });
        } catch (e) {
          expect(e).to.be.undefined;
        }
      });
    }
  }

  it(`should be able to transfer buffer`, () => {
    try {
      cy.getFramesFromFile(`audio_samples/test.wav`).then( async pcm => {
        const leopard = await LeopardWorker.create(
          ACCESS_KEY,
          { publicPath: '/test/leopard_params.pv', forceWrite: true },
          { enableAutomaticPunctuation: false }
        );

        let copy = new Int16Array(pcm.length);
        copy.set(pcm);
        await leopard.process(copy, {transfer: true, transferCallback: data => { copy = data; } });
        leopard.terminate();

        expect(copy).to.deep.eq(pcm);
      });
    } catch (e) {
      expect(e).to.be.undefined;
    }
  });
});
