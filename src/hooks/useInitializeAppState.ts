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
import { useProfile } from '@/api/hooks/useProfile'
import { useWorkerPolling } from '@/hooks/useWorkerPolling'
import { useCreateNotification, useGetNotificationBySentId } from '@/api/hooks/useNotifications'
import { isFocusScheduleFeatureEnabled } from '@/lib/utils/environment.util'

export const useInitializeAppState = () => {  
  useProfile()
  useWorkerPolling()
  
  const posthog = usePostHog()
  const { beginCheckForUpdates } = useUpdate()
  const { user } = useAuth()
  const { profile } = useProfile()
  const { setConnected } = useConnectedStore()
  const { loadShortcutFromStorage } = useShortcutStore()
  const { mutate: createNotification } = useCreateNotification()
  const { data: focusScheduleNotification, isLoading: isFocusScheduleNotificationLoading } = useGetNotificationBySentId('focus_schedule_feature_intro')
  
  
  useEffect(() => {
    initSentry()

    const init = async () => {
      await supabase.auth.getSession()
      await setupTray()
      const hasPermissions = await invoke<boolean>('check_accessibility_permissions')
      beginCheckForUpdates()

      document.addEventListener('keydown', (event) => {
        if (event.metaKey && event.key === 'r') {
          window.location.reload()
        }
      })

      if (hasPermissions) {
        await invoke('start_system_monitoring')
      }
    }

    init()
  }, [])

  useEffect(() => {
    if (user && profile?.latitude && profile?.longitude) {
      setConnected(true)
      posthog.identify(user.id, {
        email: user.email,
      })
    } 

  }, [user, posthog, profile])



  useEffect(() => {
    loadShortcutFromStorage()
  }, [loadShortcutFromStorage])

  // Show notification about Focus Schedule feature to new users
  useEffect(() => {
    if(!isFocusScheduleFeatureEnabled(user?.email) || isFocusScheduleNotificationLoading) {
      return
    }
    if (user?.id && !focusScheduleNotification) {
      createNotification({
        user_id: user.id,
        content: '📅 Schedule focus sessions to protect your most productive times!',
        notification_type: 'app',
        notification_sub_type: 'info',
        notification_sent_id: 'focus_schedule_feature_intro',
        read: 0,
        dismissed: 0,
      })
    }
  }, [user?.id, focusScheduleNotification, createNotification, isFocusScheduleNotificationLoading])

}
