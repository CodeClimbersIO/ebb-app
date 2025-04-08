import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import supabase from '@/lib/integrations/supabase'
import { hostname } from '@tauri-apps/plugin-os'

const DEVICE_ID_KEY = 'ebb_device_id'

const getOrCreateDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

const cleanupHostname = (name: string): string => {
  return name
    .replace(/\.local$/, '') // Remove .local suffix
    .replace(/-/g, ' ') // Replace dashes with spaces
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const registerDevice = async (session: Session) => {
    try {
      // Get device name using Tauri OS plugin
      const rawHostname = await hostname()
      const deviceName = rawHostname ? cleanupHostname(rawHostname) : 'Unknown Device'
      const deviceId = getOrCreateDeviceId()

      // Only proceed if we have a license
      const { data: license } = await supabase
        .from('licenses')
        .select('id, status')
        .eq('user_id', session.user.id)
        .in('status', ['active', 'trialing'])
        .single()

      if (!license?.id) return

      // Check existing devices
      const { data: existingDevices } = await supabase
        .from('license_devices')
        .select('*')
        .eq('license_id', license.id)
        .order('last_active', { ascending: true })

      // If we have max devices and none is current device, remove oldest
      if (existingDevices && 
          existingDevices.length >= 3 && 
          !existingDevices.some(d => d.device_id === deviceId)) {
        const oldestDevice = existingDevices[0]
        
        // First invalidate the session if it exists
        if (oldestDevice.session_id) {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invalidate-device-session`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
                },
                body: JSON.stringify({
                  device_id: oldestDevice.device_id,
                  license_id: license.id,
                  session_id: oldestDevice.session_id
                })
              }
            )
            if (!response.ok) {
              console.error('Failed to invalidate oldest device session')
            }
          } catch (err) {
            console.error('Error invalidating oldest device session:', err)
          }
        }

        // Remove the device
        await supabase
          .from('license_devices')
          .delete()
          .eq('device_id', oldestDevice.device_id)
      }

      // Register/update current device with session token
      await supabase
        .from('license_devices')
        .upsert({
          license_id: license.id,
          device_id: deviceId,
          device_name: deviceName,
          last_active: new Date().toISOString(),
          session_id: session.access_token
        }, {
          onConflict: 'license_id,device_id'
        })
    } catch (err) {
      console.error('Error registering device:', err)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (session) {
        registerDevice(session)
      }
    }).catch((error) => {
      setLoading(false)
      throw error
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      
      if (session) {
        await registerDevice(session)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
