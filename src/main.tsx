import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { PostHogProvider } from 'posthog-js/react'
import App from './App'
import posthog from 'posthog-js'

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  debug: true, // Enable debug mode to see what's happening
  loaded: (client: typeof posthog) => {
    if (import.meta.env.DEV) {
      console.log('PostHog loaded in development mode')
      client.debug()
    }
  }
}

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
