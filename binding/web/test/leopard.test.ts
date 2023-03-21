import { Leopard, LeopardWorker } from "../";
import testData from "./test_data.json";

// @ts-ignore
import leopardParams from "./leopard_params";
import { PvModel } from '@picovoice/web-utils';

const ACCESS_KEY: string = Cypress.env("ACCESS_KEY");

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
    expect(leopard).to.not.be.undefined;
    expect(leopard.sampleRate).to.be.eq(16000);
    expect(typeof leopard.version).to.eq('string');
    expect(leopard.version).length.to.be.greaterThan(0);

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
  params: {
    accessKey?: string,
    model?: PvModel
  } = {}
) => {
  const {
    accessKey = ACCESS_KEY,
    model = { publicPath: '/test/leopard_params.pv', forceWrite: true }
  } = params;

  try {
    const leopard = await instance.create(accessKey, model);
    expect(leopard).to.not.be.undefined;

    const { transcript, words } = await leopard.process(inputPcm);

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
            let expectedTranscript = testParam.transcript;
            for (const punctuation of testParam.punctuations) {
              expectedTranscript = expectedTranscript.replaceAll(punctuation, '');
            }

            const suffix = (testParam.language === 'en') ? '' : `_${testParam.language}`;
            await runProcTest(instance, pcm, expectedTranscript, {
              model: { publicPath: `/test/leopard_params${suffix}.pv`, forceWrite: true }
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
            await runProcTest(instance, pcm, testParam.transcript, {
              model: { publicPath: `/test/leopard_params${suffix}.pv`, forceWrite: true }
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
