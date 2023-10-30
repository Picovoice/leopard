import "./App.css";
import { useState } from "react";

import Transcriber from "./Transcriber";

function App() {
  const [show, setShow] = useState(true);
  return (
    <div className="App">
      <h1>Leopard React Hook ("useLeopard" from @picovoice/leopard-react)</h1>
      <button onClick={() => setShow(!show)}>
        Toggle Transcriber {show ? "OFF" : "ON"}
      </button>
      <br />
      <br />
      {show && <Transcriber />}
    </div>
  );
}

export default App;
