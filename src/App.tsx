import { useEffect } from 'react'
import './App.css'
import { AppRouter } from './routes'
import { ThemeProvider } from '@/components/ThemeProvider'
import supabase from '@/lib/integrations/supabase'
import { trace, info, error } from '@tauri-apps/plugin-log'
import { setupTray } from '@/lib/tray'

const App = () => {
  trace('Trace')
  info('Info')
  error('Error')

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize auth
        await supabase.auth.getSession()
        
        // Setup tray
        await setupTray()
      } catch (error) {
        console.error('Error during initialization:', error)
      }
    }

    init()
  }, [])

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <main>
        <AppRouter />
      </main>
    </ThemeProvider>
  )
}

export default App
