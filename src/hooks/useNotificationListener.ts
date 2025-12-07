import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { info } from '@tauri-apps/plugin-log'
import { useEffect } from 'react'
import { EbbWorker } from '@/lib/ebbWorker'
import { useNavigate } from 'react-router-dom'
import { SmartSessionApi } from '@/api/ebbApi/smartSessionApi'
import { useFlowTimer } from '@/lib/stores/flowTimer'
import { FlowSessionApi } from '@/api/ebbApi/flowSessionApi'
import { AnalyticsService } from '@/lib/analytics'

interface BlockedApp {
  app_name: string
  app_external_id: string
}

const trackBlockedApps = (blockedApps: BlockedApp[], workflowId?: string, workflowName?: string) => {
  blockedApps.forEach((app) => {
    // For websites, use app_external_id (the URL), for apps use app_name
    const blockedName = app.app_external_id || app.app_name

    AnalyticsService.trackEvent('app_or_website_block_attempt', {
      blocked_item_name: blockedName,
      workflow_id: workflowId,
      workflow_name: workflowName,
    })
  })
}

export const useNotificationListener = () => {
  const navigate = useNavigate()
  useEffect(() => {
    let unlistenStartFlow: UnlistenFn | undefined
    let unlistenEndSession: UnlistenFn | undefined
    let unlistenAddTimeEvent: UnlistenFn | undefined
    let unlistenSnoozeBlocking: UnlistenFn | undefined
    let unlistenAppBlocked: UnlistenFn | undefined

    const setupListeners = async () => {

      unlistenStartFlow = await listen('start-flow', async (event: { payload: { workflow_id?: string } }) => {
        EbbWorker.debounceWork(async () => {
          let session
          if (event.payload?.workflow_id) {
            console.log(`Starting session with workflow ID: ${event.payload.workflow_id}`)
            session = await SmartSessionApi.startSmartSessionWithWorkflow(event.payload.workflow_id)
          } else {
            console.log('Starting smart session (no specific workflow)')
            session = await SmartSessionApi.startSmartSession()
          }
          console.log(`session started: ${JSON.stringify(session)}`)
          navigate('/flow')
        })
      })

      unlistenAddTimeEvent = await listen('add-time-event', async () => {
        info('App: adding time event')
        EbbWorker.debounceWork(async () => {
          info('App: adding time event')
          await useFlowTimer.getState().addToTimer(15 * 60)
        })
      })
      unlistenSnoozeBlocking = await listen('snooze-blocking', async () => {
        info('App: snoozing blocking')
        EbbWorker.debounceWork(async () => {
          await invoke('snooze_blocking', {
            duration: 1000 * 60 // 1 minute snoozer
          })
        })
      })
      unlistenEndSession = await listen('end-session', async () => {
        info('App: ending session')
        EbbWorker.debounceWork(async () => {
          window.dispatchEvent(new Event('end-session'))
        })
      })
      unlistenAppBlocked = await listen('on-app-blocked', async (event: { payload: { blocked_apps: BlockedApp[] } }) => {
        info('App: app blocked')
        EbbWorker.debounceWork(async () => {
          try {
            const session = await FlowSessionApi.getInProgressFlowSessionWithWorkflow()
            const isHardMode = session?.workflow_json?.settings.difficulty === 'hard'

            if (isHardMode) {
              await invoke('show_notification', { notificationType: 'blocked-app-hard' })
            } else {
              await invoke('show_notification', { notificationType: 'blocked-app' })
            }

            if (event.payload?.blocked_apps) {
              trackBlockedApps(
                event.payload.blocked_apps,
                session?.workflow_id,
                session?.workflow_json?.name
              )
            }
          } catch (error) {
            console.error(`Error getting in progress flow session with workflow: ${error}`, error)
          }
        })
      })
    }

    void setupListeners()

    return () => {
      unlistenStartFlow?.()
      unlistenEndSession?.()
      unlistenAddTimeEvent?.()
      unlistenSnoozeBlocking?.()
      unlistenAppBlocked?.()
    }
  }, []) 
}
