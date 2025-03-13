import { useEffect } from 'react'
import './App.css'
import { AppRouter } from './routes'
import { ThemeProvider } from '@/components/ThemeProvider'
import supabase from '@/lib/integrations/supabase'
import { invoke } from '@tauri-apps/api/core'
import { setupTray } from './lib/tray'
import { initSentry } from '@/components/Sentry'
import { useUpdate } from './hooks/useUpdate'

const App = () => {
  const { beginCheckForUpdates } = useUpdate()
  useEffect(() => {
    initSentry()

    beginCheckForUpdates()
    const init = async () => {
      await supabase.auth.getSession()
      await setupTray()
      const hasPermissions = await invoke<boolean>('check_accessibility_permissions')

      if (hasPermissions) {
        await invoke('start_system_monitoring')
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
