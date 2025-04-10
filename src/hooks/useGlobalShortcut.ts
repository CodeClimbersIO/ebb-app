import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { error as logError } from '@tauri-apps/plugin-log'
import { listen } from '@tauri-apps/api/event'
import { FlowSessionApi } from '@/api/ebbApi/flowSessionApi'
import {
  initializeGlobalShortcut,
  SHORTCUT_EVENT,
  unregisterAllManagedShortcuts,
} from '@/lib/globalShortcutManager'

export function useGlobalShortcut() {
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    let unlistenShortcut: (() => void) | undefined

    const handleShortcut = async () => {
      if (!mounted) return

      try {
        const window = getCurrentWindow()
        void Promise.all([
          window.show().catch(err => logError(`(Shortcut) Error showing window: ${err}`)),
          window.setFocus().catch(err => logError(`(Shortcut) Error focusing window: ${err}`))
        ])

        const activeSession = await FlowSessionApi.getInProgressFlowSession()
        const targetPath = activeSession ? '/flow' : '/start-flow'
        
        if (mounted) {
          navigate(targetPath, { replace: true })
        }
      } catch (error) {
        logError(`(Shortcut) Error getting session or navigating: ${error}`)
        if (mounted) {
          navigate('/start-flow', { replace: true })
        }
      }
    }

    const setup = async () => {
      try {
        await initializeGlobalShortcut()

        if (mounted) {
          unlistenShortcut = await listen(SHORTCUT_EVENT, () => {
            void handleShortcut()
          })
        }
      } catch (error) {
        logError(`(Shortcut) Setup failed: ${error}`)
      }
    }

    void setup()

    return () => {
      mounted = false
      
      const cleanup = async () => {
        try {
          if (unlistenShortcut) {
            unlistenShortcut()
          }
          await unregisterAllManagedShortcuts()
        } catch (error) {
          logError(`(Shortcut) Cleanup error: ${error}`)
        }
      }
      void cleanup()
    }
  }, [])
} 
