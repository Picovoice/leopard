self.onmessage = (event) => {
  switch (event.data.command) {
    case "process":
      self.postMessage(event.data.inputFrame);
      break;
  }
}
