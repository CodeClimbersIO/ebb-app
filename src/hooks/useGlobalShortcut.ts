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
import { error as logError, info as logInfo } from '@tauri-apps/plugin-log'

export function useGlobalShortcut() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let mounted = true
    let unlistenShortcut: (() => void) | undefined

    const handleShortcut = async () => {
      logInfo('(Shortcut) handleShortcut called')
      if (!mounted) return

      try {
        logInfo('(Shortcut) Showing window')
        const window = getCurrentWindow()
        void Promise.all([
          window.show().catch(err => logError(`(Shortcut) Error showing window: ${err}`)),
          window.setFocus().catch(err => logError(`(Shortcut) Error focusing window: ${err}`))
        ])

        if (location.pathname === '/onboarding/shortcut-tutorial') {
          logInfo('(Shortcut) Marking onboarding completed')
          await OnboardingUtils.markOnboardingCompleted()
          if (mounted) {
            logInfo('(Shortcut) Navigating to start-flow')
            navigate('/start-flow', { replace: true })
          }
          logInfo('(Shortcut) handleShortcut completed')
          return
        }


        if (!OnboardingUtils.isOnboardingCompleted()) {
          logInfo('(Shortcut) Onboarding not completed, skipping')
          return
        }

        const activeSession = await FlowSessionApi.getInProgressFlowSession()
        const targetPath = activeSession ? '/flow' : '/start-flow'
        
        if (mounted) {
          logInfo('(Shortcut) Navigating to target path')
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
            logInfo('(Shortcut) Shortcut event triggered')
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
      if (unlistenShortcut) {
        unlistenShortcut()
      }
    }
  }, [navigate, location.pathname])
} 
