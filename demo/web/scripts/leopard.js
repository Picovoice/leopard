let leopard = null;

window.onload = function () {
  const audioContext = new (window.AudioContext || window.webKitAudioContext)(
    {sampleRate: 16000}
  );

  function readAudioFile(selectedFile, callback) {
    let reader = new FileReader();
    reader.onload = function (ev) {
      let wavBytes = reader.result;
      audioContext.decodeAudioData(wavBytes, callback);
    };
    reader.readAsArrayBuffer(selectedFile);
  }

  const fileSelector = document.getElementById("audioFile");
  fileSelector.addEventListener("change", (event) => {
    writeMessage("Loading audio file...");
    const fileList = event.target.files;
    readAudioFile(fileList[0], async (audioBuffer) => {
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

      writeMessage("Transcribing audio file...");
      const {transcript, words} = await leopard.process(i16PCM, {transfer: true});
      document.getElementById("result").innerHTML = transcript;
      setWordTable(words);
      writeMessage("Transcribing audio file... done!");
    });
  });

  const displayTimer = document.getElementById("displayTimer");
  const recordButton = document.getElementById("recordAudio");
  const stopRecord = document.getElementById("stopRecord");

  let timer = null;
  let currentTimer = 0.0;
  let audioData = [];
  const recorderEngine = {
    onmessage: (event) => {
      switch (event.data.command) {
        case "process":
          audioData.push(event.data.inputFrame);
          break;
      }
    }
  }
  recordButton.addEventListener("click", async () => {
    displayTimer.style.display = "inline";
    stopRecord.style.display = "inline";
    recordButton.style.display = "none";

    currentTimer = 0.0;
    audioData = [];
    try {
      writeMessage("Recording audio...");
      await window.WebVoiceProcessor.WebVoiceProcessor.subscribe(recorderEngine);
      timer = setInterval(() => {
        currentTimer += 0.1;
        displayTimer.innerText = `${currentTimer.toFixed(1)} / 120`;
        if (currentTimer === 120) {
          stopRecord.click();
        }
      }, 100);
    } catch (e) {
      writeMessage(e);
    }
  });

  stopRecord.addEventListener("click", async () => {
    displayTimer.style.display = "none";
    stopRecord.style.display = "none";
    recordButton.style.display = "inline";

    await window.WebVoiceProcessor.WebVoiceProcessor.unsubscribe(recorderEngine);
    clearInterval(timer);

    const frames = new Int16Array(audioData.length * 512);
    for (let i = 0; i < audioData.length; i++) {
      frames.set(audioData[i], i * 512);
    }

    writeMessage("Transcribing audio file...");
    const {transcript, words} = await leopard.process(frames, {transfer: true});
    document.getElementById("result").innerHTML = transcript;
    setWordTable(words);
    writeMessage("Transcribing audio file... done!");
  });
}

function writeMessage(message) {
  console.log(message);
  document.getElementById("status").innerHTML = message;
}

function setWordTable(words) {
  let html = `
    <tr>
      <th>word</th>
      <th>startSec</th>
      <th>endSec</th>
      <th>confidence</th>
      <th>speaker tag</th>
    </tr>
  `;
  words.forEach(obj => {
    html += `
      <tr>
        <td>${obj.word}</td>
        <td>${obj.startSec.toFixed(3)}</td>
        <td>${obj.endSec.toFixed(3)}</td>
        <td>${obj.confidence.toFixed(3)}</td>
        <td>${obj.speakerTag}</td>
      </tr>
    `
  });
  document.getElementById("words").innerHTML = html;
}

async function startLeopard(accessKey) {
  writeMessage("Leopard is loading. Please wait...");
  try {
    leopard = await LeopardWeb.LeopardWorker.create(
      accessKey,
      leopardModel,
      {
          enableAutomaticPunctuation: true,
          enableDiarization: true
      }
    );
    document.getElementById("control").style.display = "block";
    writeMessage("Leopard worker ready!");
  } catch (err) {
    writeMessage(err);
  }
}