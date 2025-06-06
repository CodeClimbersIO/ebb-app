import { listen } from '@tauri-apps/api/event'
import NotificationManager from '@/lib/notificationManager'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const notificationManager = NotificationManager.getInstance()

export function useBlockedEvents() {
  const location = useLocation()
  const difficulty = location.state?.difficulty || 'medium'

  useEffect(() => {
    const setupListener = async () => {
      const unlisten = await listen('on-app-blocked', () => {
        notificationManager.show({
          type: 'blocked-app',
          difficulty
        })
      })

      return unlisten
    }

    const unlistenPromise = setupListener()

    return () => {
      unlistenPromise.then(unlisten => unlisten())
    }
  }, [difficulty]) 
}
