import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import supabase from '@/lib/integrations/supabase'

// Note: Device ID and hostname logic removed from here
// It will be handled where device registration occurs

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
       console.error('[useAuth Simple] Error getting initial session:', error)
      if (isMounted) {
         setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, changedSession) => {
       console.log(`[useAuth Simple] onAuthStateChange triggered. Event: ${_event}, Session: ${changedSession ? changedSession.user.id : 'null'}`)
       if (isMounted) {
          setUser(changedSession?.user ?? null)
          setSession(changedSession)
          // Set loading to false only if it was true, 
          // otherwise could cause flicker if already loaded from getSession
          setLoading(loading => loading ? false : false) 
       }
    })

    return () => {
       console.log('[useAuth Simple] Cleanup: Unsubscribing.')
       isMounted = false
       subscription.unsubscribe()
    }
  }, [])

  // Return session as well, needed for access token in device registration
  return { user, session, loading }
}
