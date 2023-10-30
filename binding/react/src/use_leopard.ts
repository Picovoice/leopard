// /*
//   Copyright 2021-2023 Picovoice Inc.
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

import {
  LeopardModel,
  LeopardOptions,
  LeopardTranscript,
  LeopardWorker,
} from '@picovoice/leopard-web';

export const useLeopard = (): {
  transcript: LeopardTranscript | null;
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
  release: () => void;
} => {
  const leopardRef = useRef<LeopardWorker | null>(null);

  const [transcript, setTranscript] = useState<LeopardTranscript | null>(null);
  const [sampleRate, setSampleRate] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

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

  const process = useCallback(async (pcm, options = {}): Promise<void> => {
    try {
      if (!leopardRef.current) {
        setError(
          new Error('Leopard has not been initialized or has been released')
        );
        return;
      }

      const result = await leopardRef.current?.process(pcm, options);
      setTranscript(result);
      setError(null);
    } catch (e: any) {
      setError(e);
    }
  }, []);

  const release = useCallback(() => {
    if (leopardRef.current) {
      leopardRef.current?.terminate();
      leopardRef.current = null;

      setIsLoaded(false);
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
    transcript,
    sampleRate,
    isLoaded,
    error,
    init,
    process,
    release,
  };
};
