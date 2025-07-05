import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { invoke } from '@tauri-apps/api/core'


export function useBlockedEvents() {
  const location = useLocation()
  const difficulty = location.state?.difficulty || 'medium'

  useEffect(() => {
    let unlistenBlockedApp: UnlistenFn | undefined

    const setupListener = async () => {
      unlistenBlockedApp = await listen('on-app-blocked', () => {
        invoke('show_notification', {
          notificationType: 'blocked-app'
        })
      })
    }

    void setupListener()

    return () => {
      unlistenBlockedApp?.()
    }
  }, [difficulty]) 
}
