import { useEffect } from 'react'
import { useProfile, useUpdateProfile } from './api/useProfile'
import { calculateCurrentStatus } from '../lib/ebbStatusManager'


export const useEbbStatus = () => {
  const { profile, isLoading, refetch } = useProfile()
  const { mutate: updateProfile } = useUpdateProfile()

  useEffect(() => {
    if(isLoading || !profile) return
    const statusInterval = setInterval(() => {      
      calculateCurrentStatus().then((status) => {
        const last_check_in = new Date().toISOString()
        if(profile?.online_status !== status) {
          updateProfile({ id: profile.id, online_status: status, last_check_in })
          refetch()
        }
      })
    }, 1000 * 30)

    const checkInInterval = setInterval(() => {
      const last_check_in = profile?.last_check_in
      updateProfile({ id: profile.id, last_check_in })
    }, 1000 * 60 * 5)

    return () => {
      clearInterval(statusInterval)
      clearInterval(checkInInterval)
    }
  }, [profile, isLoading])

}
