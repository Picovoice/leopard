const transcribeButton = document.getElementById('transcribeBtn')
const rssInput = document.getElementById('rssInput')
const loadingContainer = document.getElementById('loadingContainer')

document.addEventListener('submit', (e) => {
  const form = e.target;
  if (form.rss.value === undefined || form.rss.value.length === 0) {
    return
  }

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
    if(res.ok) {
      res.text().then(text => {
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
    } else {
      console.error(res)
    }
  }).catch(e => {
    console.error(e)
  }).finally(() => {
    transcribeButton.disabled = false
    rssInput.disabled = false
    loadingContainer.style.visibility = 'hidden'
  });

});
