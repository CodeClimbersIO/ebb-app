import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import supabase from '@/lib/integrations/supabase'
import { error as logError } from '@tauri-apps/plugin-log'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

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

  return { user, session, loading }
}
