// /*
//   Copyright 2023 Picovoice Inc.
//
//   You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
//   file accompanying this source.
//
//   Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
//   an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
//   specific language governing permissions and limitations under the License.
// */
//
import { useCallback, useEffect, useRef, useState } from 'react';

import { WebVoiceProcessor } from '@picovoice/web-voice-processor';

import {
  LeopardModel,
  LeopardOptions,
  LeopardTranscript,
  LeopardWorker,
} from '@picovoice/leopard-web';

const DEFAULT_MAX_RECORDING_SEC = 120;

export const useLeopard = (): {
  result: LeopardTranscript | null;
  sampleRate: number | null;
  isLoaded: boolean;
  error: Error | null;
  init: (
    accessKey: string,
    model: LeopardModel,
    options?: LeopardOptions
  ) => Promise<void>;
  process: (
    pcm: Int16Array,
    options?: {
      transfer?: boolean;
      transferCallback?: (data: Int16Array) => void;
    }
  ) => Promise<void>;
  start: (macRecordingSec?: number) => Promise<void>;
  stop: () => Promise<void>;
  isRecording: boolean;
  recordingElapsedSec: number;
  release: () => void;
} => {
  const leopardRef = useRef<LeopardWorker | null>(null);

  const [result, setResult] = useState<LeopardTranscript | null>(null);
  const [sampleRate, setSampleRate] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const [audioData, setAudioData] = useState<Int16Array[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingElapsedSec, setRecordingElapsedSec] = useState<number>(0);
  const timerRef = useRef<null | ReturnType<typeof setTimeout>>(null);
  const recorderEngineRef = useRef({
    onmessage: (event: any) => {
      switch (event.data.command) {
        case 'process':
          setAudioData(prev => [...prev, event.data.inputFrame]);
          break;
        default:
          break;
      }
    },
  });

  const errorCallback = useCallback((e: Error) => {
    setError(e);
  }, []);

  const init = useCallback(
    async (
      accessKey: string,
      model: LeopardModel,
      options: LeopardOptions = {}
    ): Promise<void> => {
      try {
        if (!leopardRef.current) {
          leopardRef.current = await LeopardWorker.create(
            accessKey,
            model,
            options
          );
          setSampleRate(leopardRef.current?.sampleRate);
          setIsLoaded(true);
          setError(null);
        }
      } catch (e: any) {
        setError(e);
      }
    },
    [errorCallback]
  );

  const process = useCallback(
    async (pcm: Int16Array, options = {}): Promise<void> => {
      try {
        if (!leopardRef.current) {
          setError(
            new Error('Leopard has not been initialized or has been released')
          );
          return;
        }

        const processResult = await leopardRef.current.process(pcm, options);
        setResult(processResult);
        setError(null);
      } catch (e: any) {
        setError(e);
      }
    },
    []
  );

  const stop = useCallback(async (): Promise<void> => {
    try {
      await WebVoiceProcessor.unsubscribe(recorderEngineRef.current);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const frames = new Int16Array(audioData.length * 512);
      for (let i = 0; i < audioData.length; i++) {
        frames.set(audioData[i], i * 512);
      }

      await process(frames, {
        transfer: true,
      });

      setIsRecording(false);
    } catch (e: any) {
      setError(e);
    }
  }, [audioData]);

  const start = useCallback(
    async (macRecordingSec = DEFAULT_MAX_RECORDING_SEC): Promise<void> => {
      try {
        setAudioData([]);
        await WebVoiceProcessor.subscribe(recorderEngineRef.current);

        const startTime = new Date().getTime();
        timerRef.current = setInterval(async () => {
          const intervalTime = new Date().getTime();
          const elapsedTime = intervalTime - startTime;
          const elapsedSeconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);
          if (elapsedSeconds >= macRecordingSec) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            setRecordingElapsedSec(0);
            await stop();
          } else {
            setRecordingElapsedSec(elapsedSeconds);
          }
        }, 1000);

        setIsRecording(true);
      } catch (e: any) {
        setError(e);
      }
    },
    []
  );

  const release = useCallback(() => {
    if (leopardRef.current) {
      leopardRef.current?.terminate();
      leopardRef.current = null;

      setError(null);
      setIsLoaded(false);
      setIsRecording(false);
    }
  }, []);

  useEffect(
    () => (): void => {
      if (leopardRef.current) {
        leopardRef.current.terminate();
        leopardRef.current = null;
      }
    },
    []
  );

  return {
    result,
    sampleRate,
    isLoaded,
    error,
    init,
    process,
    start,
    stop,
    isRecording,
    recordingElapsedSec,
    release,
  };
};
