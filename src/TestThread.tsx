import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

export function TestThread() {
  const [count, setCount] = useState(0);
  const [threadInfo, setThreadInfo] = useState('');
  const [logs, setLogs] = useState<{ timestamp: string; count: number; thread_info: string; }[]>([]);

  useEffect(() => {
    // Log initial render thread info
    console.log('Frontend thread info:', {
      timestamp: new Date().toISOString(),
      thread: window.navigator.hardwareConcurrency
        ? `Available CPU cores: ${window.navigator.hardwareConcurrency}`
        : 'Thread info not available'
    });

    // Listen for counter updates from the Rust backend
    const unlisten = listen("counter-update", (event) => {
      const { count, thread_info } = event.payload as { count: number, thread_info: string };
      setCount(count);
      setThreadInfo(thread_info);

      // Add to logs
      setLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        count,
        thread_info
      }]);
    });

    return () => {
      unlisten.then(f => f()); // Cleanup listener
    };
  }, []);

  const startTask = async () => {
    console.log('Invoking background task from frontend thread');
    try {
      await invoke("start_background_task");
    } catch (e) {
      console.error("Failed to start background task:", e);
    }
  };

  return (
    <div className="container p-4">
      <h1 className="text-2xl mb-4">Tauri Threading Example</h1>
      <div className="mb-4">
        <p>Counter value: {count}</p>
        <p>Last update from thread: {threadInfo}</p>
      </div>

      <button
        onClick={startTask}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Start Background Task
      </button>

      <div className="mt-8">
        <h2 className="text-xl mb-2">Thread Activity Log:</h2>
        <div className="max-h-60 overflow-y-auto border p-4">
          {logs.map((log, index) => (
            <div key={index} className="mb-2 text-sm">
              <span className="text-gray-500">{log.timestamp}</span>
              <br />
              <span>Count: {log.count}</span>
              <br />
              <span className="font-mono">{log.thread_info}</span>
              <hr className="my-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
