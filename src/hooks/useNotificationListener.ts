import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { info } from '@tauri-apps/plugin-log'
import { useEffect } from 'react'
import { EbbWorker } from '../lib/ebbWorker'
import { useNavigate } from 'react-router-dom'
import { SmartSessionApi } from '../api/ebbApi/smartSessionApi'
import { useFlowTimer } from '../lib/stores/flowTimer'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'

export const useNotificationListener = () => {
  const navigate = useNavigate()
  useEffect(() => {
    let unlistenStartFlow: UnlistenFn | undefined
    let unlistenEndSession: UnlistenFn | undefined
    let unlistenAddTimeEvent: UnlistenFn | undefined
    let unlistenSnoozeBlocking: UnlistenFn | undefined
    let unlistenAppBlocked: UnlistenFn | undefined

    const setupListeners = async () => {

      // add start-flow, end session, add to timer, and block snooze listeners
      unlistenStartFlow = await listen('start-flow', async () => {
        info('App: starting flow')
        EbbWorker.debounceWork(async () => {
          const session = await SmartSessionApi.startSmartSession()
          info(`session started: ${JSON.stringify(session)}`)
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
      unlistenAppBlocked = await listen('on-app-blocked', async () => {
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
