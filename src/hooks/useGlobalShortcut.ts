import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { FlowSessionApi } from '@/api/ebbApi/flowSessionApi'
import { OnboardingUtils } from '@/lib/utils/onboarding.util'
import {
  initializeGlobalShortcut,
  SHORTCUT_EVENT,
} from '@/api/ebbApi/shortcutApi'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { info, error as logError } from '@tauri-apps/plugin-log'
import { invoke } from '@tauri-apps/api/core'

export function useGlobalShortcut() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let mounted = true
    let unlistenShortcut: (() => void) | undefined
    let unlistenNotificationDismissed: UnlistenFn | undefined
    let unlistenNotificationCreated: UnlistenFn | undefined

    const handleShortcut = async () => {
      info('handleShortcut')
      if (!mounted) return

      try {

        info('handleShortcut')
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
        info(`activeSession: ${JSON.stringify(activeSession)}`)
        // if(activeSession) {
        //   info('in progress session, skipping quick start notification')
        //   return
        // }

        info('showing quick start notification')
        invoke('show_notification', {
          notificationType: 'quick-start',
        })

        const targetPath = '/start-flow'
        
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
            info('handleShortcut first registry')
            void handleShortcut()
          })
          unlistenNotificationCreated = await listen('notification-created', async () => {
            try {
              await unlistenShortcut?.() // reinitialize the global shortcut when notifications is dismissed
            } catch (error) {
              logAndToastError(`(Shortcut) Error unlistening shortcut: ${error}`, error)
            }
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
      unlistenNotificationDismissed = await listen('notification-dismissed', async () => {
        info('notification-dismissed handleShortcut')
        unlistenShortcut = await listen(SHORTCUT_EVENT, () => {
          info('handleShortcut second registry')
          void handleShortcut()
        })
      })
    }
    
    void setup()

    return () => {
      mounted = false
      unlistenShortcut?.()
      unlistenNotificationDismissed?.()
      unlistenNotificationCreated?.()
    }
  }, [navigate, location.pathname])
} 
