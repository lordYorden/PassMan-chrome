import { useState } from "react";
import "./App.css";

function App() {
  //const [count, setCount] = useState(0);
  const [color, setColorState] = useState("white");

  const setColor = async (color: string) => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (color: string) => {
          document.body.style.backgroundColor = color;
        },
        args: [color],
      });
    }
  };

  return (
    <>
      <div className="card">
        <button onClick={() => setColor(color)}>
          set color
        </button>
        
        <input
          type="color"
          value={color}
          onChange={(e) => {
            setColorState(e.target.value);
          }}
        />
      </div>
    </>
  );
}

export default App;
