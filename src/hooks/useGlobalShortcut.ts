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
      if (!mounted) {
        console.log('(Shortcut) Handler called but component unmounted')
        return
      }
      console.log('(Shortcut) Handler triggered')

      try {
        // Attempt to show and focus, but don't let it block navigation logic
        const window = getCurrentWindow()
        // Fire and forget promise for window manipulation
        void Promise.all([
          window.show().catch(err => logError(`(Shortcut) Error showing window: ${err}`)),
          window.setFocus().catch(err => logError(`(Shortcut) Error focusing window: ${err}`))
        ]).then(() => {
          if (mounted) console.log('(Shortcut) Show/Focus attempted')
        })

        // Proceed to check session and navigate immediately
        const activeSession = await FlowSessionApi.getInProgressFlowSession()
        const targetPath = activeSession ? '/flow' : '/start-flow'
        
        if (mounted) {
          console.log(`(Shortcut) Attempting navigation to ${targetPath}`)
          navigate(targetPath, { replace: true })
          console.log(`(Shortcut) Navigation call to ${targetPath} completed`)
        } else {
          console.log('(Shortcut) Component unmounted before navigation')
        }
      } catch (error) {
        logError(`(Shortcut) Error getting session or navigating: ${error}`)
        if (mounted) {
          console.log('(Shortcut) Attempting fallback navigation to /start-flow')
          navigate('/start-flow', { replace: true })
          console.log('(Shortcut) Fallback navigation call completed')
        } else {
           console.log('(Shortcut) Component unmounted before fallback navigation')
        }
      }
    }

    const setup = async () => {
      try {
        await initializeGlobalShortcut()
        console.log('(Shortcut) Initialized')

        if (mounted) {
          unlistenShortcut = await listen(SHORTCUT_EVENT, () => {
            console.log('(Shortcut) Event received from manager')
            void handleShortcut()
          })
          console.log('(Shortcut) Listener attached')
        }
      } catch (error) {
        logError(`(Shortcut) Setup failed: ${error}`)
      }
    }

    void setup()

    return () => {
      mounted = false
      console.log('(Shortcut) Cleaning up')
      
      const cleanup = async () => {
        try {
          if (unlistenShortcut) {
            unlistenShortcut()
            console.log('(Shortcut) Listener removed')
          }
          await unregisterAllManagedShortcuts()
          console.log('(Shortcut) Shortcuts unregistered')
        } catch (error) {
          logError(`(Shortcut) Cleanup error: ${error}`)
        }
      }
      void cleanup()
    }
  }, [])
} 
