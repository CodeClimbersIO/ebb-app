import { useEffect } from 'react'
import { useProfile, useUpdateProfile } from './api/useProfile'
import { calculateCurrentStatus } from '../lib/ebbStatusManager'


export const useEbbStatus = () => {
  const { profile, isLoading, refetch } = useProfile()
  const { mutate: updateProfile } = useUpdateProfile()

  useEffect(() => {
    console.log('profile', profile)
    console.log('isLoading', isLoading)
    if(isLoading || !profile) return
    const interval = setInterval(() => {      
      calculateCurrentStatus().then((status) => {
        console.log('status', status)
        console.log('profile?.online_status', profile?.online_status)
        if(profile?.online_status !== status) {
          console.log('updating profile', status)
          updateProfile({ id: profile.id, online_status: status })
          refetch()
        }
      })
    }, 1000 * 1)
    return () => clearInterval(interval)
  }, [profile, isLoading])

}
