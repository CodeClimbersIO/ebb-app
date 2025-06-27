import { listen, UnlistenFn } from '@tauri-apps/api/event'
import NotificationManager from '@/lib/notificationManager'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const notificationManager = NotificationManager.getInstance()

export function useBlockedEvents() {
  const location = useLocation()
  const difficulty = location.state?.difficulty || 'medium'

  useEffect(() => {
    let unlistenBlockedApp: UnlistenFn | undefined

    const setupListener = async () => {
      unlistenBlockedApp = await listen('on-app-blocked', () => {
        notificationManager.show({
          type: 'blocked-app',
          difficulty
        })
      })
    }

    void setupListener()

    return () => {
      unlistenBlockedApp?.()
    }
  }, [difficulty]) 
}
