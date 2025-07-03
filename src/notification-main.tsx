import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { Notification } from './Notification'
import { info as tauriInfoLogger } from '@tauri-apps/plugin-log'
import './App.css'
import { ThemeProvider } from './components/ThemeProvider'

tauriInfoLogger('Notification entry point initializing')

// Set transparent background immediately
document.body.style.background = 'transparent'
document.documentElement.style.background = 'transparent'

ReactDOM.createRoot(document.getElementById('notification-root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Notification />
    </ThemeProvider>
  </React.StrictMode>,
) 
