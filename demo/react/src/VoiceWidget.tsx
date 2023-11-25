import React, { useCallback, useState, useRef } from "react";
import { useLeopard } from "@picovoice/leopard-react";

import leopardModel from "./lib/leopardModel";

export default function VoiceWidget() {
  const accessKeyRef = useRef<string>("");
  const [isBusy, setIsBusy] = useState(false);

  const {
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
  } = useLeopard();

  const initEngine = useCallback(async () => {
    if (accessKeyRef.current.length === 0) {
      return;
    }

    setIsBusy(true);
    await init(accessKeyRef.current, leopardModel, {
      enableAutomaticPunctuation: true,
      enableDiarization: true,
    });
    setIsBusy(false);
  }, [init]);

  const toggleRecord = async () => {
    setIsBusy(true);
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
    setIsBusy(false);
  };

  return (
    <div className="voice-widget">
      <h2>VoiceWidget</h2>
      <h3>
        <label>
          AccessKey obtained from{" "}
          <a href="https://console.picovoice.ai/">Picovoice Console</a>:{" "}
          <input
            type="text"
            name="accessKey"
            disabled={isLoaded || isBusy}
            onChange={(e) => {
              accessKeyRef.current = e.target.value;
            }}
          />
          <button
            className="init-button"
            onClick={initEngine}
            disabled={isLoaded || isBusy}
          >
            Init Leopard
          </button>
          <button
            className="release-button"
            onClick={release}
            disabled={!isLoaded || isBusy}
          >
            Release
          </button>
        </label>
      </h3>
      <h3>Loaded: {JSON.stringify(isLoaded)}</h3>
      <h3>Recording: {JSON.stringify(isRecording)}</h3>
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
          if (!!e.target.files?.length) {
            setIsBusy(true);
            await processFile(e.target.files[0]);
            setIsBusy(false);
          }
        }}
        disabled={!isLoaded || isBusy}
      />
      <p>
        <b>OR</b>
      </p>
      <label htmlFor="record-audio">
        Record audio to transcribe (up to 2 minutes):{" "}
      </label>
      <span>{recordingElapsedSec}s</span>
      <br />
      <br />
      <button
        id="record-audio"
        onClick={toggleRecord}
        disabled={!isLoaded || isBusy}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      <h3>Transcript:</h3>
      <p>{result?.transcript}</p>
      {result?.words && (
        <table>
          <thead>
            <tr>
              <th>word</th>
              <th>startSec</th>
              <th>endSec</th>
              <th>confidence</th>
              <th>speakerTag</th>
            </tr>
          </thead>
          <tbody>
            {result?.words.map((obj) => (
              <tr key={obj.startSec}>
                <td>{obj.word}</td>
                <td>{obj.startSec.toFixed(3)}</td>
                <td>{obj.endSec.toFixed(3)}</td>
                <td>{obj.confidence.toFixed(3)}</td>
                <td>{obj.speakerTag}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
