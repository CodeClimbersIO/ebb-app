import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import supabase from '@/lib/integrations/supabase'
import { error as logError, info as logInfo, warn as logWarn } from '@tauri-apps/plugin-log'
import { useNavigate } from 'react-router-dom'
import { userApi } from '@/api/ebbApi/userApi'

const DEVICE_ID_KEY = 'ebb_device_id'

export const useAuth = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const handleLogout = async () => {
    const deviceId = localStorage.getItem(DEVICE_ID_KEY)

    if (!deviceId || !user) {
      logWarn('[Logout] Could not delete device registration: deviceId or user is not set')
      return
    }

    const { error: deleteError } = await userApi.deleteDevice(user.id, deviceId)

    if (deleteError) {
      logError(`[Logout] Failed to delete device registration for ${user.id}: ${deleteError.message}`)
    } else {
      logInfo(`[Logout] Deleted device registration ${deviceId} for ${user.id}.`)
    }

    logInfo('[Logout] Signing out...')
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      logError(`[Logout] Error signing out: ${signOutError.message}`)
    } else {
      navigate('/login')
    }
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
      logError(`[useAuth Simple] Error getting initial session: ${error}`)
      if (isMounted) {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, changedSession) => {
      if (isMounted) {
        setUser(changedSession?.user ?? null)
        setSession(changedSession)
        setLoading(loading => loading ? false : false) 
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, session, loading, handleLogout }
}
