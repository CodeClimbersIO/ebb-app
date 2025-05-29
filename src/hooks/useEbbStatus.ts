import { useEffect } from 'react'
import { useProfile, useUpdateProfile } from '../api/hooks/useProfile'
import { calculateCurrentStatus } from '../lib/ebbStatusManager'
import { DateTime } from 'luxon'



export const useEbbStatus = () => {
  const { profile, isLoading, refetch } = useProfile()
  const { mutate: updateProfile } = useUpdateProfile()
  useEffect(() => {
    if(isLoading || !profile) return
    const statusInterval = setInterval(() => {     
      calculateCurrentStatus().then((status) => {
        const last_check_in = DateTime.now()
        if(profile?.online_status !== status) {
          updateProfile({ id: profile.id, online_status: status, last_check_in: last_check_in.toISO() })
          refetch()
        }
        // if time since last check in is greater than 5 minutes, update the last check in
        const timeSinceLastCheckIn = DateTime.fromISO(profile?.last_check_in).diffNow('minutes').minutes
        if(timeSinceLastCheckIn < -5) {
          updateProfile({ id: profile.id, last_check_in: last_check_in.toISO() })
          refetch()
        }
      })
    }, 1000 * 30)


    return () => {
      // the interval is unmounted whenever the profile in the dependency array changes, which happens when the profile is "refetch()". A new interval is then created on mount of the hook.
      clearInterval(statusInterval)
    }
  }, [profile, isLoading])

}
