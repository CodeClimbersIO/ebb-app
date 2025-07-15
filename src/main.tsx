import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { PostHogProvider } from 'posthog-js/react'
import App from './App'
import { info as tauriInfoLogger } from '@tauri-apps/plugin-log'

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


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={options}
    >
      <App />
    </PostHogProvider>
  </React.StrictMode>,
)
