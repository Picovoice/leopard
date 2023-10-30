import React, { useCallback, useRef, useState } from "react";

import { useLeopard } from "@picovoice/leopard-react";
import { WebVoiceProcessor } from "@picovoice/web-voice-processor";
import { PvEngine } from "@picovoice/web-voice-processor/dist/types/types";

import leopardModel from "./lib/leopardModel";

const MAX_REC_SEC = 2 * 60;

export default function Transcriber() {
  const accessKeyRef = useRef<string>("");
  const timerRef = useRef<null | ReturnType<typeof setTimeout>>(null);
  const recorderEngineRef = useRef<PvEngine>({
    onmessage: (event) => {
      switch (event.data.command) {
        case "process":
          setAudioData((prev) => [...prev, event.data.inputFrame]);
          break;
      }
    },
  });

  const [counter, setCounter] = useState<number>(0);
  const [audioData, setAudioData] = useState<Int16Array[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const { transcript, isLoaded, error, init, process, release } = useLeopard();

  const initEngine = useCallback(async () => {
    if (accessKeyRef.current.length === 0) {
      return;
    }

    await init(accessKeyRef.current, leopardModel, {
      enableAutomaticPunctuation: true,
    });
  }, [init]);

  const processAudioFile = async (audioFile) => {
    // @ts-ignore
    const audioContext = new (window.AudioContext || window.webKitAudioContext)(
      { sampleRate: 16000 }
    );

    function readAudioFile(selectedFile, callback) {
      let reader = new FileReader();
      reader.onload = function (ev) {
        let wavBytes = reader.result;
        audioContext.decodeAudioData(wavBytes as ArrayBuffer, callback);
      };
      reader.readAsArrayBuffer(selectedFile);
    }

    readAudioFile(audioFile, async (audioBuffer) => {
      const f32PCM = audioBuffer.getChannelData(0);
      const i16PCM = new Int16Array(f32PCM.length);

      const INT16_MAX = 32767;
      const INT16_MIN = -32768;
      i16PCM.set(
        f32PCM.map((f) => {
          let i = Math.trunc(f * INT16_MAX);
          if (f > INT16_MAX) i = INT16_MAX;
          if (f < INT16_MIN) i = INT16_MIN;
          return i;
        })
      );

      await process(i16PCM, {
        transfer: true,
      });
    });
  };

  const handleRecordStart = async () => {
    setCounter(0);
    setAudioData([]);

    const startTime = new Date().getTime();

    await WebVoiceProcessor.subscribe(recorderEngineRef.current);
    timerRef.current = setInterval(() => {
      const intervalTime = new Date().getTime();
      const elapsedTime = intervalTime - startTime;
      const elapsedSeconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);
      if (elapsedSeconds > MAX_REC_SEC) {
        handleRecordStop();
        setCounter(0);
        timerRef.current && clearInterval(timerRef.current);
      } else {
        setCounter(elapsedSeconds);
      }
    }, 1000);

    setIsRecording(true);
  };

  const handleRecordStop = async () => {
    setCounter(0);

    await WebVoiceProcessor.unsubscribe(recorderEngineRef.current);
    timerRef.current && clearInterval(timerRef.current);

    const frames = new Int16Array(audioData.length * 512);
    for (let i = 0; i < audioData.length; i++) {
      frames.set(audioData[i], i * 512);
    }

    await process(frames, {
      transfer: true,
    });

    setIsRecording(false);
  };

  const toggleRecord = async () => {
    if (isRecording) {
      await handleRecordStop();
    } else {
      await handleRecordStart();
    }
  };

  return (
    <div className="transcriber">
      <h2>Transcriber</h2>
      <h3>
        <label>
          AccessKey obtained from{" "}
          <a href="https://console.picovoice.ai/">Picovoice Console</a>:{" "}
          <input
            type="text"
            name="accessKey"
            onChange={(e) => {
              accessKeyRef.current = e.target.value;
            }}
          />
          <button
            className="init-button"
            onClick={initEngine}
            disabled={isLoaded}
          >
            Init Leopard
          </button>
          <button
            className="release-button"
            onClick={release}
            disabled={error !== null || !isLoaded}
          >
            Release
          </button>
        </label>
      </h3>
      <h3>Loaded: {JSON.stringify(isLoaded)}</h3>
      <h3>Error: {JSON.stringify(error !== null)}</h3>
      {error && <p className="error-message">{error.toString()}</p>}
      <br />
      <label htmlFor="audio-file">Choose audio file to transcribe:</label>
      <input
        type="file"
        accept="audio/*"
        id="audio-file"
        name="audio-file"
        onChange={async (e) => {
          if (e.target.files) {
            await processAudioFile(e.target.files[0]);
          }
        }}
      />
      <p>
        <b>OR</b>
      </p>
      <label htmlFor="record-audio">
        Record audio to transcribe (up to 2 minutes):
      </label>
      <button id="record-audio" className="record-audio" onClick={toggleRecord}>
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      <span>{counter}</span>
      <br />
      <br />
      <h3>Transcript:</h3>
      <p>{transcript?.transcript}</p>
      <h3>Words:</h3>
      {transcript?.words && (
        <table>
          <tr>
            <th>word</th>
            <th>startSec</th>
            <th>endSec</th>
            <th>confidence</th>
          </tr>
          {transcript?.words.map((obj) => (
            <tr>
              <td>{obj.word}</td>
              <td>{obj.startSec.toFixed(3)}</td>
              <td>{obj.endSec.toFixed(3)}</td>
              <td>{obj.confidence.toFixed(3)}</td>
            </tr>
          ))}
        </table>
      )}
    </div>
  );
}
