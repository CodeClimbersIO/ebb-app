import { useEffect } from 'react'
import './App.css'
import { AppRouter } from './routes'
import { ThemeProvider } from '@/components/ThemeProvider'
import supabase from '@/lib/integrations/supabase'
import { trace, info, error } from '@tauri-apps/plugin-log'
import { setupTray } from '@/lib/tray'
import { invoke } from '@tauri-apps/api/core'

const App = () => {
  trace('Trace')
  info('Info')
  error('Error')

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize auth
        await supabase.auth.getSession()

        // Setup tray - only happens once when App mounts
        await setupTray()
        const hasPermissions = await invoke<boolean>('check_accessibility_permissions')
        if (hasPermissions) {
          await invoke('start_system_monitoring')
        }
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
