import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { listen } from '@tauri-apps/api/event'
import { FlowSessionApi } from '@/api/ebbApi/flowSessionApi'
import { OnboardingUtils } from '@/lib/utils/onboarding'
import {
  initializeGlobalShortcut,
  SHORTCUT_EVENT,
} from '@/api/ebbApi/shortcutApi'
import { logAndToastError } from '@/lib/utils/logAndToastError'
import { error as logError } from '@tauri-apps/plugin-log'

export function useGlobalShortcut() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let mounted = true
    let unlistenShortcut: (() => void) | undefined

    const handleShortcut = async () => {
      if (!mounted) return

      try {
        const window = getCurrentWindow()
        void Promise.all([
          window.show().catch(err => logAndToastError(`(Shortcut) Error showing window: ${err}`, err)),
          window.setFocus().catch(err => logAndToastError(`(Shortcut) Error focusing window: ${err}`, err))
        ])

        if (location.pathname === '/onboarding/shortcut-tutorial') {
          await OnboardingUtils.markOnboardingCompleted()
          if (mounted) {
            navigate('/start-flow', { replace: true })
          }
          return
        }


        if (!OnboardingUtils.isOnboardingCompleted()) {
          return
        }

        const activeSession = await FlowSessionApi.getInProgressFlowSession()
        const targetPath = activeSession ? '/flow' : '/start-flow'
        
        if (mounted) {
          navigate(targetPath, { replace: true })
        }
      } catch (error) {
        logAndToastError(`(Shortcut) Error getting session or navigating: ${error}`, error)
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
        // if database is locked, don't log and taost
        if (error instanceof Error && error.message.includes('database is locked')) {
          logError(`(Shortcut) Database is locked: ${error}`)
          return
        }

        logAndToastError(`(Shortcut) Setup failed: ${error}`, error)
      }
    }

    void setup()

    return () => {
      mounted = false
      if (unlistenShortcut) {
        unlistenShortcut()
      }
    }
  }, [navigate, location.pathname])
} 
