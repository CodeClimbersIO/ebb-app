import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { info } from '@tauri-apps/plugin-log'
import { useEffect } from 'react'
import { EbbWorker } from '../lib/ebbWorker'
import { useNavigate } from 'react-router-dom'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { logAndToastError } from '../lib/utils/ebbError.util'
import { SmartSessionApi } from '../api/ebbApi/smartSessionApi'
import { useFlowTimer } from '../lib/stores/flowTimer'

export const useNotificationListener = () => {
  const navigate = useNavigate()
  useEffect(() => {
    let unlistenStartFlow: UnlistenFn | undefined
    let unlistenEndSession: UnlistenFn | undefined
    let unlistenAddTimeEvent: UnlistenFn | undefined
    let unlistenSnoozeBlocking: UnlistenFn | undefined

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
      unlistenEndSession = await listen('navigate-to-flow-recap', async () => {
        info('App: navigate-to-flow-recap')
        EbbWorker.debounceWork(async () => {
          const window = getCurrentWindow()
          void Promise.all([
            window.show().catch(err => logAndToastError(`(Flow recap) Error showing window: ${err}`, err)),
            window.setFocus().catch(err => logAndToastError(`(Flow recap) Error focusing window: ${err}`, err))
          ])
          navigate('/flow-recap')
        }, 'navigate-to-flow-recap')
      })
      unlistenAddTimeEvent = await listen('add-time-event', async () => {
        info('App: adding time event')
        EbbWorker.debounceWork(async () => {
          info('App: adding time event')
          console.log('adding time event')
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

    }

    void setupListeners()

    return () => {
      unlistenStartFlow?.()
      unlistenEndSession?.()
      unlistenAddTimeEvent?.()
      unlistenSnoozeBlocking?.()
    }
  }, []) 
}
