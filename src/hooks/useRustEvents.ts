import { listen } from '@tauri-apps/api/event'
import NotificationManager from '@/lib/notificationManager'
import { useEffect } from 'react'

const notificationManager = NotificationManager.getInstance()

export function useRustEvents() {
  useEffect(() => {
    const setupListener = async () => {
      const unlisten = await listen('on-app-blocked', () => {
        notificationManager.show({
          type: 'blocked-app',
        })
      })

      return unlisten
    }

    const unlistenPromise = setupListener()

    return () => {
      unlistenPromise.then(unlisten => unlisten())
    }
  }, []) 
}
