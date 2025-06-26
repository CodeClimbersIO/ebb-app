import { useEffect } from 'react'
import { useProfile, useUpdateProfile } from '../api/hooks/useProfile'
import { calculateCurrentStatus } from '../lib/ebbStatusManager'
import { DateTime } from 'luxon'
import { listen } from '@tauri-apps/api/event'
import { useUpdateRollupForUser } from '../api/hooks/useActivityRollups'
import { SmartSessionApi } from '../api/ebbApi/smartSessionApi'

export const useWorkerPolling = () => {
  const { profile, isLoading, refetch } = useProfile()
  const { mutate: updateProfile } = useUpdateProfile()
  const { updateRollupForUser } = useUpdateRollupForUser()

  useEffect(() => {
    if(isLoading || !profile) return
    const setupListener = async () => {
      const unlistenOnlinePing = await listen('online-ping', () => {
        calculateCurrentStatus().then(async (status) => {
          const last_check_in = DateTime.now()

          if(profile?.online_status !== status) {
            updateProfile({ id: profile.id, online_status: status, last_check_in: last_check_in.toISO() })
            refetch()
          }
          // if time since last check in is greater than 5 minutes, update the last check in
          const timeSinceLastCheckIn = DateTime.fromISO(profile?.last_check_in).diffNow('minutes').minutes
          if(timeSinceLastCheckIn < -5) {
            updateRollupForUser()
            updateProfile({ id: profile.id, last_check_in: last_check_in.toISO() })
            refetch()
          }
        })
        SmartSessionApi.startSmartSession()
      })

      return () => {
        unlistenOnlinePing()
      }
    }

    const unlistenPromise = setupListener()

    return () => {
      unlistenPromise.then(unlisten => unlisten())
    }
  }, [profile, isLoading, updateRollupForUser]) 

}
