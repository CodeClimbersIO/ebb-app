import { useEffect } from 'react'
import { useProfile, useUpdateProfile } from '../api/hooks/useProfile'
import { calculateCurrentStatus } from '../lib/ebbStatusManager'
import { DateTime } from 'luxon'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { useUpdateRollupForUser } from '../api/hooks/useActivityRollups'
import { useDeviceProfile } from '../api/hooks/useDeviceProfile'
import { EbbWorker } from '../lib/ebbWorker'
import { invoke } from '@tauri-apps/api/core'
import { canUseSmartFocus } from '../lib/utils/environment.util'
import { SmartSessionApi } from '../api/ebbApi/smartSessionApi'
import { useAuth } from './useAuth'

type OnlinePingEvent = {
  event: string
  id: number
  payload: string
}

export const useWorkerPolling = () => {
  const { user } = useAuth()
  const { profile, isLoading, refetch } = useProfile()
  const { deviceId } = useDeviceProfile()
  const { mutate: updateProfile } = useUpdateProfile()
  const { updateRollupForUser } = useUpdateRollupForUser()

  useEffect(() => {
    if(isLoading || !profile) return
    let unlisten: UnlistenFn
    const setupListener = async () => {
      unlisten = await listen('online-ping', (event: OnlinePingEvent) => {
        const run = async ()=> {
          const status = await calculateCurrentStatus()
          const last_check_in = DateTime.now()
          const version = await invoke<string>('get_app_version')
          if(profile?.online_status !== status) {
            updateProfile({ id: profile.id, online_status: status, last_check_in: last_check_in.toISO(), version })
            refetch()
          }
          // if time since last check in is greater than 5 minutes, update the last check in
          const timeSinceLastCheckIn = DateTime.fromISO(profile?.last_check_in).diffNow('minutes').minutes
          if(timeSinceLastCheckIn < -5) {
            updateRollupForUser()
            updateProfile({ id: profile.id, last_check_in: last_check_in.toISO(), version })
            refetch()
          }
          if(deviceId && canUseSmartFocus(user?.email)) {
            const shouldSuggestSmartSession = await SmartSessionApi.checkShouldSuggestSmartSession(deviceId)
            if(shouldSuggestSmartSession) {
              invoke('show_notification', {
                notificationType: 'smart-start-suggestion',
              })
            }
          }
        }
        EbbWorker.work(event.payload, run) // used to make sure we don't run the same work multiple times

      })
    }
    setupListener()

    return () => {
      unlisten?.()
    }
  }, [profile, isLoading, updateRollupForUser, deviceId, user]) 

}
