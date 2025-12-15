import { renderHook } from '@testing-library/react-hooks/dom';
import { LeopardWord } from '@picovoice/leopard-web';
import { useLeopard } from '../src';

// @ts-ignore
import leopardParams from '@/leopard_params.js';

// @ts-ignore
import testData from './test_data.json';

const ACCESS_KEY = Cypress.env('ACCESS_KEY');
const DEVICE = Cypress.env('DEVICE');

const CYPRESS_BASE_URI = "/__cypress/src";

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

const runProcTest = async (
  file: File,
  expectedTranscript: string,
  expectedWords: Record<string, string | number>[],
  expectedErrorRate: number,
  params: {
    accessKey?: string;
    model?: Record<string, string | boolean>;
    enableAutomaticPunctuation?: boolean;
    enableDiarization?: boolean;
    useCER?: boolean;
  } = {}
) => {
  const {
    accessKey = ACCESS_KEY,
    model = { publicPath: `${CYPRESS_BASE_URI}/test/leopard_params.pv`, forceWrite: true },
    enableAutomaticPunctuation = false,
    enableDiarization = false,
    useCER = false,
  } = params;
  const { result } = renderHook(() => useLeopard());

  cy.wrapHook(() =>
    result.current.init(accessKey, model, {
      device: DEVICE,
      enableAutomaticPunctuation: enableAutomaticPunctuation,
      enableDiarization: enableDiarization,
    })
  ).then(() => {
    expect(
      result.current.isLoaded,
      `Failed to load '${model.publicPath}' with ${result.current.error}`
    ).to.be.true;
  });

  cy.wrapHook(() => result.current.processFile(file)).then(() => {
    const transcript = result.current.result!.transcript;
    expect(transcript).to.eq(expectedTranscript);

    validateMetadata(
      result.current.result!.words,
      expectedWords.map((w: any) => ({
        word: w.word,
        startSec: w.start_sec,
        endSec: w.end_sec,
        confidence: w.confidence,
        speakerTag: w.speaker_tag,
      })),
      enableDiarization
    );

    const errorRate = wordErrorRate(transcript, expectedTranscript, useCER);
    expect(errorRate).to.be.lt(expectedErrorRate);
  });

  cy.wrapHook(result.current.release).then(() => {
    expect(
      result.current.isLoaded,
      `Failed to release leopard with ${result.current.error}`
    ).to.be.false;
  });
};

describe('Leopard binding', () => {
  it('should be able to init via public path', () => {
    const { result } = renderHook(() => useLeopard());

    cy.wrapHook(() =>
      result.current.init(ACCESS_KEY, {
        publicPath: `${CYPRESS_BASE_URI}/test/leopard_params.pv`,
        forceWrite: true,
      }, {
        device: DEVICE
      })
    ).then(() => {
      expect(
        result.current.isLoaded,
        `Failed to load 'leopard_params.pv' with ${result.current.error}`
      ).to.be.true;
    });
  });

  it('should be able to init via base64', () => {
    const { result } = renderHook(() => useLeopard());

    cy.wrapHook(() =>
      result.current.init(ACCESS_KEY, {
        base64: leopardParams,
        forceWrite: true,
      }, {
        device: DEVICE,
      })
    ).then(() => {
      expect(
        result.current.isLoaded,
        `Failed to load 'leopard_params.js' with ${result.current.error}`
      ).to.be.true;
    });
  });

  it('should show invalid model path error message', () => {
    const { result } = renderHook(() => useLeopard());

    cy.wrapHook(() =>
      result.current.init(ACCESS_KEY, {
        publicPath: `${CYPRESS_BASE_URI}/leopard_params_failed.pv`,
        forceWrite: true,
      }, {
        device: DEVICE,
      })
    ).then(() => {
      expect(result.current.isLoaded).to.be.false;
      expect(result.current.error?.toString()).to.contain(
        `Error response returned while fetching model from '${CYPRESS_BASE_URI}/leopard_params_failed.pv'`
      );
    });
  });

  it('should show invalid access key error message', () => {
    const { result } = renderHook(() => useLeopard());

    cy.wrapHook(() =>
      result.current.init('', {
        publicPath: `${CYPRESS_BASE_URI}/test/leopard_params.pv`,
        forceWrite: true,
      }, {
        device: DEVICE,
      })
    ).then(() => {
      expect(result.current.isLoaded).to.be.false;
      expect(result.current.error?.toString()).to.contain('Invalid AccessKey');
    });
  });

  it('should be able to stop audio recording if limit reached', () => {
    const { result } = renderHook(() => useLeopard());
    const MAX_RECORDING_SEC = 1;

    cy.wrapHook(() =>
      result.current.init(ACCESS_KEY, {
        publicPath: `${CYPRESS_BASE_URI}/test/leopard_params.pv`,
        forceWrite: true,
      }, {
        device: DEVICE,
      })
    ).then(() => {
      expect(
        result.current.isLoaded,
        `Failed to load 'leopard_params.pv' with ${result.current.error}`
      ).to.be.true;
    });

    cy.wrapHook(() => result.current.startRecording(MAX_RECORDING_SEC))
      .then(() => {
        expect(result.current.isRecording).to.be.true;
      })
      .wait(MAX_RECORDING_SEC * 1000)
      .then(() => {
        expect(result.current.isRecording).to.be.false;
        expect(result.current.error?.toString()).to.contain(
          'Maximum recording time reached'
        );
      });
  });

  for (const testParam of testData.tests.language_tests) {
    const suffix = testParam.language === 'en' ? '' : `_${testParam.language}`;

    it(`should be able to process (${testParam.language})`, () => {
      cy.getFileObj(`audio_samples/${testParam.audio_file}`).then(
        async file => {
          await runProcTest(
            file,
            testParam.transcript,
            testParam.words,
            testParam.error_rate,
            {
              model: {
                publicPath: `${CYPRESS_BASE_URI}/test/leopard_params${suffix}.pv`,
                forceWrite: true,
              },
            }
          );
        }
      );
    });

    it(`should be able to process with punctuation (${testParam.language})`, () => {
      cy.getFileObj(`audio_samples/${testParam.audio_file}`).then(
        async file => {
          await runProcTest(
            file,
            testParam.transcript_with_punctuation,
            testParam.words,
            testParam.error_rate,
            {
              enableAutomaticPunctuation: true,
              model: {
                publicPath: `${CYPRESS_BASE_URI}/test/leopard_params${suffix}.pv`,
                forceWrite: true,
              },
            }
          );
        }
      );
    });

    it(`should be able to process with diarization (${testParam.language})`, () => {
      cy.getFileObj(`audio_samples/${testParam.audio_file}`).then(
        async file => {
          await runProcTest(
            file,
            testParam.transcript,
            testParam.words,
            testParam.error_rate,
            {
              enableDiarization: true,
              model: {
                publicPath: `${CYPRESS_BASE_URI}/test/leopard_params${suffix}.pv`,
                forceWrite: true,
              },
            }
          );
        }
      );
    });

    it(`should be able to process audio recording (${testParam.language})`, () => {
      const { result } = renderHook(() => useLeopard());

      cy.wrapHook(() =>
        result.current.init(ACCESS_KEY, {
          publicPath:
            testParam.language === 'en'
              ? `${CYPRESS_BASE_URI}/test/leopard_params.pv`
              : `${CYPRESS_BASE_URI}/test/leopard_params_${testParam.language}.pv`,
          forceWrite: true,
        }, {
          device: DEVICE,
        })
      ).then(() => {
        expect(
          result.current.isLoaded,
          `Failed to load ${testParam.audio_file} (${testParam.language}) with ${result.current.error}`
        ).to.be.true;
      });

      cy.wrapHook(result.current.startRecording).then(() => {
        expect(result.current.isRecording).to.be.true;
      });

      cy.mockRecording(`audio_samples/${testParam.audio_file}`).then(() => {
        cy.wrapHook(result.current.stopRecording).then(() => {
          expect(result.current.isRecording).to.be.false;

          const {
            transcript: expectedTranscript,
            words: expectedWords,
            error_rate: expectedErrorRate,
            language,
          } = testParam;
          const useCER = language === 'ja';

          const transcript = result.current.result!.transcript;
          expect(transcript).to.eq(expectedTranscript);

          validateMetadata(
            result.current.result!.words,
            expectedWords.map((w: any) => ({
              word: w.word,
              startSec: w.start_sec,
              endSec: w.end_sec,
              confidence: w.confidence,
              speakerTag: w.speaker_tag,
            })),
            false
          );

          const errorRate = wordErrorRate(
            transcript,
            expectedTranscript,
            useCER
          );
          expect(errorRate).to.be.lt(expectedErrorRate);
        });
      });
    });
  }

  for (const testParam of testData.tests.diarization_tests) {
    it(`should be able to process diarization multiple speakers (${testParam.language})`, () => {
      const { result } = renderHook(() => useLeopard());

      cy.wrapHook(() =>
        result.current.init(
          ACCESS_KEY,
          {
            publicPath:
              testParam.language === 'en'
                ? `${CYPRESS_BASE_URI}/test/leopard_params.pv`
                : `${CYPRESS_BASE_URI}/test/leopard_params_${testParam.language}.pv`,
            forceWrite: true,
          },
          { device: DEVICE, enableDiarization: true }
        )
      ).then(() => {
        expect(
          result.current.isLoaded,
          `Failed to load ${testParam.audio_file} (${testParam.language}) with ${result.current.error}`
        ).to.be.true;
      });

      cy.getFileObj(`audio_samples/${testParam.audio_file}`).then(file => {
        cy.wrapHook(() => result.current.processFile(file)).then(() => {
          const words = result.current.result!.words;
          expect(words.length).to.eq(testParam.words.length);
          for (let i = 0; i < words.length; i++) {
            expect(words[i].word).to.eq(testParam.words[i].word);
            expect(words[i].speakerTag).to.eq(testParam.words[i].speaker_tag);
          }
        });
      });
    });
  }
});
