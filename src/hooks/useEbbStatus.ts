import { useEffect } from 'react'
import { useProfile, useUpdateProfile } from './api/useProfile'
import { calculateCurrentStatus } from '../lib/ebbStatusManager'


export const useEbbStatus = () => {
  const { profile, isLoading, refetch } = useProfile()
  const { mutate: updateProfile } = useUpdateProfile()

  useEffect(() => {
    if(isLoading || !profile) return
    const interval = setInterval(() => {      
      calculateCurrentStatus().then((status) => {
        if(profile?.online_status !== status) {
          updateProfile({ id: profile.id, online_status: status })
          refetch()
        }
      })
    }, 1000 * 39)
    return () => clearInterval(interval)
  }, [profile, isLoading])

}
