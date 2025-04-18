import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { PostHogProvider } from 'posthog-js/react'
import App from './App'
import { useErrorStore } from './lib/stores/errorStore'

// Override console.error
const originalConsoleError = console.error
console.error = (...args: unknown[]) => {
  // Call the original console.error
  originalConsoleError(...args)

  // Format the error message (simple example)
  const errorMessage = args.map(arg => {
    if (arg instanceof Error) {
      return `${arg.message}\n${arg.stack}`
    } else if (arg && typeof arg === 'object') {
      try {
        return JSON.stringify(arg)
      } catch {
        return '[Unserializable object]'
      }
    } else {
      return String(arg)
    }
  }).join(' ')

  // Set the error in the Zustand store
  // Need to use getState() outside of React components
  useErrorStore.getState().setError(errorMessage)
}

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
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
