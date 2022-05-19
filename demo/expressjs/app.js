const express = require('express');
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const axios = require('axios')
const { Leopard, LeopardActivationLimitReached } = require('@picovoice/leopard-node')

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.redirect('/index')
});

app.post('/rss-transcribe', async (req, res) => {
  console.log("Parsing RSS feed " + req.body.rss)
  let parser = new Parser();
  let feed = {}
  try {
    feed = await parser.parseURL(req.body.rss)
  } catch(err) {
    console.log(err)
    res.status(400).send(err)
    return
  }
  console.log("Parse complete.")

  if (feed.items[0].enclosure.url === undefined) {
    let err = Error("No item to transcribe on the given feed.")
    console.error(err)
    res.status(400).send(err)
    return
  }

  const podcastAudioUrl = feed.items[0].enclosure.url
  console.log("Fetching file from " + podcastAudioUrl)
  let dlResponse = {}
  try {
    dlResponse = await axios.get(podcastAudioUrl, {responseType: "arraybuffer"})
  } catch(err) {
    console.error(err)
    res.status(400).send(err)
    return
  }
  console.log("File obtained.")

  console.log("Writing data to local file...")
  const fileName = `${Math.random().toString(36).substr(2, 5)}.mp3`
  fs.writeFileSync(fileName, dlResponse.data)
  console.log("File write complete")

  console.log("Transcribing audio...")
  try {
    const leo = new Leopard("${YOUR ACCESS KEY HERE}")
    const transcript = leo.processFile(fileName)
    console.log("Transcription complete")
    leo.release()
    res.send(transcript)
  } catch (err) {
    if (err instanceof LeopardActivationLimitReached) {
      console.error(`AccessKey has reached it's processing limit.`);
    } else {
      console.error(err);
    }
    res.status(500).send(err)
  }
  finally {
    fs.unlinkSync(fileName)
  }
});

module.exports = app;
