import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

import { MonitoringControl } from "./Monitor";
import { isEnabled, disable } from '@tauri-apps/plugin-autostart'
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { TestThread } from "./TestThread";
// when using `"withGlobalTauri": true`, you may use
// const { isPermissionGranted, requestPermission, sendNotification, } = window.__TAURI__.notification;




disable()
function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    // Do you have permission to send a notification?
    let permissionGranted = await isPermissionGranted();
    // If not we need to request it
    console.log("permissionGranted", permissionGranted)
    if (!permissionGranted) {
      console.log("requesting permission")
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }
    console.log("permissionGranted", permissionGranted)
    // Once permission has been granted we can send the notification
    if (permissionGranted) {
      sendNotification({ title: 'Tauri', body: 'Tauri is awesome!' });
    }
    console.log("is enabled", await isEnabled())
    const isStartupEnabled = await isEnabled()
    if (isStartupEnabled) {
      await disable()
    }
    console.log(`registered for autostart? ${await isEnabled()}`)
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>
      <MonitoringControl />
      <TestThread />
      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>
    </main>
  );
}

export default App;
