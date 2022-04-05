const transcribeButton = document.getElementById('transcribeBtn')
const rssInput = document.getElementById('rssInput')
const loadingContainer = document.getElementById('loadingContainer')

document.addEventListener('submit', (e) => {
  const form = e.target;

  transcribeButton.disabled = true
  rssInput.disabled = true
  loadingContainer.style.visibility = 'visible'

  e.preventDefault()

  fetch(`/rss-transcribe`, {
    method: "post",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      rss: form.rss.value
    })
  }).then(res => {
    res.text().then(text => {
      transcribeButton.disabled = false
      rssInput.disabled = false
      loadingContainer.style.visibility = 'hidden'

      let transcriptBlob = new Blob([text], {
        type: 'text/plain;charset=utf-8'
      });
      let url = window.URL.createObjectURL(transcriptBlob);
      let a = document.createElement('a');
      a.href = url;
      a.download = "transcript.txt";
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  });

});
