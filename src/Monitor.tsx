// Example using TypeScript and Tauri API
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// Start monitoring function
async function startMonitoring() {
  try {
    await invoke('start_monitoring');
    console.log('Monitoring started');

    // Set up event listeners
    await listen('mouse-event', (event) => {
      console.log('Mouse event:', event.payload);
      // event.payload will contain x, y, event_type, and scroll_delta
    });

    await listen('keyboard-event', (event) => {
      console.log('Keyboard event:', event.payload);
    });

    await listen('window-focus', (event) => {
      console.log('Window focus changed:', event.payload);
    });
  } catch (error) {
    console.error('Failed to start monitoring:', error);
  }
}

// Stop monitoring function
async function stopMonitoring() {
  try {
    await invoke('stop_monitoring');
    console.log('Monitoring stopped');
  } catch (error) {
    console.error('Failed to stop monitoring:', error);
  }
}

// Example React component using these functions
import { useState } from 'react';

export function MonitoringControl() {
  const [isMonitoring, setIsMonitoring] = useState(false);

  const toggleMonitoring = async () => {
    if (isMonitoring) {
      await stopMonitoring();
      setIsMonitoring(false);
    } else {
      await startMonitoring();
      setIsMonitoring(true);
    }
  };

  return (
    <div>
      <button onClick={toggleMonitoring}>
        {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
      </button>
    </div>
  );
}