import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import supabase from '@/lib/integrations/supabase'

export interface LicenseState {
  id: string
  status: string
  license_type: 'perpetual' | 'subscription'
  expiration_date: string | null
}

interface LicenseContextType {
  license: LicenseState | null
  isLoading: boolean
  refetchLicense: () => Promise<void>
}

const LicenseContext = createContext<LicenseContextType | null>(null)

export function LicenseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [license, setLicense] = useState<LicenseState | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchLicense = async () => {
    if (!user) {
      setLicense(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      // Fetch active license
      const { data, error } = await supabase
        .from('licenses')
        .select('id, status, license_type, expiration_date')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      if (error) {
        console.error('Error fetching license:', error)
        throw error
      }

      if (!data) {
        // Try fetching trial license if no active license
        const { data: trialData, error: trialError } = await supabase
          .from('licenses')
          .select('id, status, license_type, expiration_date')
          .eq('user_id', user.id)
          .eq('status', 'trialing')
          .maybeSingle()

        if (trialError) {
          console.error('Error fetching trial license:', trialError)
          throw trialError
        }
        
        setLicense(trialData)
      } else {
        setLicense(data)
      }
    } catch (err) {
      console.error('Failed to fetch license status:', err)
      setLicense(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLicense()
  }, [user?.id]) // Only refetch when user ID changes

  // Listen for realtime changes to the user's license
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('license-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'licenses',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchLicense()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id]) // Only resubscribe when user ID changes

  return (
    <LicenseContext.Provider
      value={{
        license,
        isLoading,
        refetchLicense: fetchLicense,
      }}
    >
      {children}
    </LicenseContext.Provider>
  )
}

export function useLicense() {
  const context = useContext(LicenseContext)
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider')
  }
  return context
}

// Hook to protect paid features
export function useRequirePro() {
  const { license, isLoading } = useLicense()
  const hasAccess = !isLoading && license !== null
  return { hasAccess, isLoading }
} 
