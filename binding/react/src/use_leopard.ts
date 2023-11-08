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
  isLoaded: boolean;
  error: Error | null;
  init: (
    accessKey: string,
    model: LeopardModel,
    options?: LeopardOptions,
    processOptions?: {
      transfer?: boolean;
      transferCallback?: (data: Int16Array) => void;
    }
  ) => Promise<void>;
  processFile: (file: File) => Promise<void>;
  startRecording: (maxRecordingSec?: number) => Promise<void>;
  stopRecording: () => Promise<void>;
  isRecording: boolean;
  recordingElapsedSec: number;
  release: () => Promise<void>;
} => {
  const [result, setResult] = useState<LeopardTranscript | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingElapsedSec, setRecordingElapsedSec] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);

  const leopardRef = useRef<LeopardWorker | null>(null);
  const audioDataRef = useRef<Int16Array[]>([]);
  const processOptionsRef = useRef({});
  const timerRef = useRef<null | ReturnType<typeof setTimeout>>(null);
  const recorderEngineRef = useRef({
    onmessage: (event: any) => {
      switch (event.data.command) {
        case 'process':
          audioDataRef.current.push(event.data.inputFrame);
          break;
        default:
          break;
      }
    },
  });

  const init = useCallback(
    async (
      accessKey: string,
      model: LeopardModel,
      options: LeopardOptions = {},
      processOptions: {
        transfer?: boolean;
        transferCallback?: (data: Int16Array) => void;
      } = {}
    ): Promise<void> => {
      try {
        if (!leopardRef.current) {
          leopardRef.current = await LeopardWorker.create(
            accessKey,
            model,
            options
          );

          processOptionsRef.current = processOptions;
          setIsLoaded(true);
          setError(null);
        }
      } catch (e: any) {
        setError(e);
      }
    },
    []
  );

  const process = useCallback(async (pcm: Int16Array): Promise<void> => {
    try {
      if (!leopardRef.current) {
        setError(
          new Error('Leopard has not been initialized or has been released')
        );
        return;
      }

      const processResult = await leopardRef.current.process(
        pcm,
        processOptionsRef.current
      );
      setResult(processResult);
    } catch (e: any) {
      setError(e);
    }
  }, []);

  const processFile = useCallback(async (audioFile: File): Promise<void> => {
    if (!leopardRef.current) {
      setError(
        new Error('Leopard has not been initialized or has been released')
      );
      return new Promise(resolve => resolve());
    }

    // @ts-ignore
    const audioContext = new (window.AudioContext || window.webKitAudioContext)(
      { sampleRate: leopardRef.current.sampleRate }
    );

    const readAudioFile = (
      file: File,
      callback: (audioBuffer: AudioBuffer) => Promise<void>
    ): void => {
      const reader = new FileReader();

      reader.onload = (): void => {
        const wavBytes = reader.result;
        audioContext.decodeAudioData(wavBytes as ArrayBuffer, callback);
      };

      reader.readAsArrayBuffer(file);
    };

    return new Promise<void>(resolve => {
      readAudioFile(audioFile, async (audioBuffer: AudioBuffer) => {
        const f32PCM = audioBuffer.getChannelData(0);
        const i16PCM = new Int16Array(f32PCM.length);
        const INT16_MAX = 32767;
        const INT16_MIN = -32768;
        i16PCM.set(
          f32PCM.map(f => {
            let i = Math.trunc(f * INT16_MAX);
            if (f > INT16_MAX) i = INT16_MAX;
            if (f < INT16_MIN) i = INT16_MIN;
            return i;
          })
        );

        await process(i16PCM);
        resolve();
      });
    });
  }, []);

  const stopRecording = useCallback(async (): Promise<void> => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);

        await WebVoiceProcessor.unsubscribe(recorderEngineRef.current);
        setIsRecording(false);

        const frames = new Int16Array(audioDataRef.current.length * 512);
        for (let i = 0; i < audioDataRef.current.length; i++) {
          frames.set(audioDataRef.current[i], i * 512);
        }
        await process(frames);

        audioDataRef.current = [];
      }
    } catch (e: any) {
      setError(e);
    }
  }, []);

  const startRecording = useCallback(
    async (maxRecordingSec = DEFAULT_MAX_RECORDING_SEC): Promise<void> => {
      if (!leopardRef.current) {
        setError(
          new Error('Leopard has not been initialized or has been released')
        );
        return;
      }

      setError(null);
      audioDataRef.current = [];

      try {
        await WebVoiceProcessor.subscribe(recorderEngineRef.current);
        setIsRecording(true);

        const startRecordingTime = new Date().getTime();
        timerRef.current = setInterval(async () => {
          const intervalTime = new Date().getTime();
          const elapsedTime = intervalTime - startRecordingTime;
          const elapsedSeconds = Math.floor(elapsedTime / 1000);
          setRecordingElapsedSec(elapsedSeconds);
          if (elapsedSeconds >= maxRecordingSec) {
            setError(new Error('Maximum recording time reached'));
            await stopRecording();
          }
        }, 1000);
      } catch (e: any) {
        setError(e);
      }
    },
    []
  );

  const release = useCallback(async (): Promise<void> => {
    try {
      if (leopardRef.current) {
        await WebVoiceProcessor.unsubscribe(recorderEngineRef.current);
        leopardRef.current?.terminate();
        leopardRef.current = null;
        setError(null);
        setIsLoaded(false);
        setIsRecording(false);
      }
    } catch (e: any) {
      setError(e);
    }
  }, []);

  useEffect(
    () => (): void => {
      if (leopardRef.current) {
        WebVoiceProcessor.unsubscribe(recorderEngineRef.current);
        leopardRef.current.terminate();
        leopardRef.current = null;
      }
    },
    []
  );

  return {
    result,
    isLoaded,
    error,
    init,
    processFile,
    startRecording,
    stopRecording,
    isRecording,
    recordingElapsedSec,
    release,
  };
};
