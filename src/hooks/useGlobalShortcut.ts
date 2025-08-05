import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { UnlistenFn } from '@tauri-apps/api/event'
import { FlowSessionApi } from '@/api/ebbApi/flowSessionApi'
import { OnboardingUtils } from '@/lib/utils/onboarding.util'
import {
  initializeGlobalShortcut,
  SHORTCUT_EVENT,
} from '@/api/ebbApi/shortcutApi'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { info, error as logError } from '@tauri-apps/plugin-log'
import { invoke } from '@tauri-apps/api/core'
import { EbbWorker } from '../lib/ebbWorker'
import { EbbListen } from '../lib/ebbListen'

export function useGlobalShortcut() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let unlistenShortcut: (() => void) | undefined
    let unlistenNotificationDismissed: UnlistenFn | undefined
    let unlistenNotificationCreated: UnlistenFn | undefined

    const handleShortcut = async () => {
      info('TROUBLESHOOTING: shortcut pressed in global-shortcut')
      try {
        if (location.pathname === '/onboarding/shortcut-tutorial') {
          await OnboardingUtils.markOnboardingCompleted()
          navigate('/start-flow', { replace: true })
          return
        }

        if (!OnboardingUtils.isOnboardingCompleted()) {
          return
        }

        const activeSession = await FlowSessionApi.getInProgressFlowSessionWithWorkflow()
        if(activeSession && activeSession.workflow_json?.settings.difficulty !== 'hard') {
          EbbWorker.debounceWork(async () => {
            invoke('show_notification', {
              notificationType: 'end-session',
            })
          }, 'show_notification')
          return
        }
        
        if(activeSession){
          return
        }

        EbbWorker.debounceWork(async () => {
          info('TROUBLESHOOTING: creating event to show quick start notification')
          invoke('show_notification', {
            notificationType: 'quick-start',
          })
        }, 'show_notification')

        const targetPath = '/start-flow'
        navigate(targetPath, { replace: true })
      } catch (error) {
        logAndToastError(`(Shortcut) Error getting session or navigating: ${error}`, error)
        navigate('/start-flow', { replace: true })
      }
    }

    const setup = async () => {
      try {
        await initializeGlobalShortcut()

        info('TROUBLESHOOTING: global shortcut initialized')

        info('TROUBLESHOOTING: setting up global shortcut listener')
        unlistenShortcut = await EbbListen.listen(SHORTCUT_EVENT, () => {
          info('TROUBLESHOOTING: shortcut pressed in global-shortcut')
          void handleShortcut()
        }, 'global-shortcut')
        
        unlistenNotificationCreated = await EbbListen.listen('notification-created', async () => {
          info('TROUBLESHOOTING: notification-created, unlistening shortcut')
          try {
            unlistenShortcut?.() // reinitialize the global shortcut when notifications is dismissed
            info('TROUBLESHOOTING: shortcut unlistened')
          } catch (error) {
            logAndToastError(`(Shortcut) Error unlistening shortcut: ${error}`, error)
          }
        }, 'global-shortcut-notification-created')
      } catch (error) {
        // if database is locked, don't log and toast
        if (error instanceof Error && error.message.includes('database is locked')) {
          logError(`(Shortcut) Database is locked: ${error}`)
          return
        }

        logAndToastError(`(Shortcut) Setup failed: ${error}`, error)
      }
    }

    const setupNotificationDismissedListener = async () => {
      unlistenNotificationDismissed = await EbbListen.listen('notification-dismissed', async () => {
        info('TROUBLESHOOTING: notification-dismissed, re-listening to shortcut')
        unlistenShortcut = await EbbListen.listen(SHORTCUT_EVENT, () => {
          info('TROUBLESHOOTING: shortcut pressed in notification-dismissed')
          void handleShortcut()
        }, 'global-shortcut')
      }, 'global-shortcut-notification-dismissed')
    }
    
    EbbWorker.debounceWork(async () => {
      info('TROUBLESHOOTING: initializing global shortcut')
      await setup()
    }, 'global-shortcut-setup')

    // Set up the notification dismissed listener immediately
    EbbWorker.debounceWork(async () => {
      void setupNotificationDismissedListener()
    }, 'global-shortcut-notification-dismissed-setup')

    return () => {
      unlistenShortcut?.()
      unlistenNotificationDismissed?.()
      unlistenNotificationCreated?.()
    }
  }, [navigate, location.pathname])
} 
