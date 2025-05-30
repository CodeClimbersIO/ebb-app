import { useEffect } from 'react'
import supabase from '@/lib/integrations/supabase'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { userApi } from '@/api/ebbApi/userApi'
import { deviceApi } from '@/api/ebbApi/deviceApi'
import { useAuthStore } from '@/lib/stores/authStore'

export const useAuth = () => {
  const { user, setUser, session, setSession, loading, setLoading } = useAuthStore()

  const logout = async () => {
    const deviceId = await deviceApi.getCurrentDeviceId()
    if (!deviceId || !user) {
      return { error: new Error('Device ID or user is not set') }
    }

    const { error: deleteError } = await userApi.deleteDevice(user.id, deviceId)

    if (deleteError) {
      return { error: deleteError }
    }

    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      return { error: signOutError }
    }

    return { error: null }
  }

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (isMounted) {
        setUser(initialSession?.user ?? null)
        setSession(initialSession)
        setLoading(false)
      }
    }).catch((error) => {
      logAndToastError(`[useAuth Simple] Error getting initial session: ${error}`, error)
      if (isMounted) {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, changedSession) => {
      if (isMounted) {
        setUser(changedSession?.user ?? null)
        setSession(changedSession)
        setLoading(false) 
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, session, loading, logout }
}
