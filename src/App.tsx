import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

import { MonitoringControl } from "./Monitor";
import { isEnabled, disable } from '@tauri-apps/plugin-autostart'

import { TestThread } from "./TestThread";
import { listen, UnlistenFn } from '@tauri-apps/api/event';
// when using `"withGlobalTauri": true`, you may use
// const { isPermissionGranted, requestPermission, sendNotification, } = window.__TAURI__.notification;


disable()
function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  useEffect(() => {
    const unlisten: Promise<UnlistenFn>[] = [];

    async function setupListeners() {
      try {
        // Store the unsubscribe functions
        unlisten.push(
          listen('mouse-event', (event) => {
            console.log('Mouse event:', event.payload);
            // event.payload will contain x, y, event_type, and scroll_delta
          })
        );

        unlisten.push(
          listen('keyboard-event', (event) => {
            console.log('Keyboard event:', event.payload);
          })
        );

        unlisten.push(
          listen('window-focus', (event) => {
            console.log('Window focus changed:', event.payload);
          })
        );
      } catch (error) {
        console.error('Failed to setup event listeners:', error);
      }
    }

    // Set up listeners
    setupListeners();

    // Cleanup function
    return () => {
      unlisten.forEach(async (unlistenPromise) => {
        const unlistenFn = await unlistenPromise;
        unlistenFn();
      });
    };
  }, []);
  async function greet() {

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
