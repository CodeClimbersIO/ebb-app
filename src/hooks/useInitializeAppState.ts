import { useEffect } from 'react'
import supabase from '@/lib/integrations/supabase'
import { invoke } from '@tauri-apps/api/core'
import { setupTray } from '@/lib/tray'
import { initSentry } from '@/components/Sentry'
import { useUpdate } from '@/hooks/useUpdate'
import { useAuth } from '@/hooks/useAuth'
import { usePostHog } from 'posthog-js/react'
import { useShortcutStore } from '@/lib/stores/shortcutStore'
import { useConnectedStore } from '@/lib/stores/connectedStore'
import { useProfile } from './api/useProfile'

export const useInitializeAppState = () => {  
  const posthog = usePostHog()
  const { beginCheckForUpdates } = useUpdate()
  const { user } = useAuth()
  useProfile()
  const { setConnected } = useConnectedStore()
  const { loadShortcutFromStorage } = useShortcutStore()
  
  
  useEffect(() => {
    initSentry()

    const init = async () => {
      await supabase.auth.getSession()
      await setupTray()
      const hasPermissions = await invoke<boolean>('check_accessibility_permissions')
      beginCheckForUpdates()

      if (hasPermissions) {
        await invoke('start_system_monitoring')
      }
    }

    init()
  }, [])

  useEffect(() => {
    if (user) {
      setConnected(true)
      posthog.identify(user.id, {
        email: user.email,
      })
    } 

  }, [user, posthog])

  useEffect(() => {
    loadShortcutFromStorage()
  }, [loadShortcutFromStorage])

}
