const express = require('express');
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const axios = require('axios')
const { Leopard } = require('@picovoice/leopard-node')

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
  let feed = await parser.parseURL(req.body.rss)
  console.log("Parse complete.")

  const podcastAudioUrl = feed.items[0].enclosure.url
  console.log("Fetching file from " + podcastAudioUrl)
  let dlResponse = await axios.get(podcastAudioUrl, { responseType: "arraybuffer" })
  console.log("File obtained.")

  console.log("Writing data to local file...")
  const fileName = `${Math.random().toString(36).substr(2, 5)}.mp3`
  fs.writeFileSync(fileName, dlResponse.data)
  console.log("File write complete")

  console.log("Transcribing audio...")
  const leo = new Leopard("${YOUR ACCESS KEY HERE}")
  const transcript = leo.processFile(fileName)
  leo.release()
  fs.unlinkSync(fileName)
  console.log("Transcription complete")

  res.send(transcript)
});

module.exports = app;
