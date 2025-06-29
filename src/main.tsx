import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { PostHogProvider } from 'posthog-js/react'
import App from './App'
import { info as tauriInfoLogger } from '@tauri-apps/plugin-log'
import { useEffect, useState } from 'react'
import { Notification } from './Notification'

tauriInfoLogger('Main.tsx intializing')

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
}

document.addEventListener('DOMContentLoaded', () => {
  const dragRegionDiv = document.createElement('div')
  dragRegionDiv.setAttribute('data-tauri-drag-region', '')
  dragRegionDiv.className = 'dragble-state'
  document.documentElement.insertBefore(dragRegionDiv, document.body)
})
const WindowRouter = ()=>{
  const [windowType, setWindowType] = useState('main')
  useEffect(() => {
    // Get the window type from URL parameters (dev) or hash (production)
    const urlParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const windowParam = urlParams.get('window') || hashParams.get('window') || 'main'
    setWindowType(windowParam)
    
  }, [])
  
  if (windowType === 'notification') {
    return <Notification />
  }
  return <App />  
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={options}
    >
      <WindowRouter />
    </PostHogProvider>
  </React.StrictMode>,
)
