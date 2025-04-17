import { useEffect, useRef, useState, useCallback } from 'react'
import supabase from '@/lib/integrations/supabase'
import { hostname } from '@tauri-apps/plugin-os'
import { useAuth } from './useAuth'
import { error as logError } from '@tauri-apps/plugin-log'
import { deviceApi } from '../api/ebbApi/deviceApi'



export const useDeviceRegistration = () => {
  const { user, session, loading: authLoading } = useAuth()
  const isRegistering = useRef(false)
  const hasAttemptedRegistration = useRef(false)
  const [isBlockedByDeviceLimit, setIsBlockedByDeviceLimit] = useState(false)
  const [retryTrigger, setRetryTrigger] = useState(0)

  const retryDeviceRegistrationCheck = useCallback(() => {
    hasAttemptedRegistration.current = false
    setRetryTrigger(count => count + 1)
  }, [])

  useEffect(() => {
    if (!authLoading && user && session) {
      
      if (isBlockedByDeviceLimit || hasAttemptedRegistration.current) {
        return
      }

      const registerOrBlock = async () => {
        if (isRegistering.current) {
          return
        }
        isRegistering.current = true
        hasAttemptedRegistration.current = true
        setIsBlockedByDeviceLimit(false)

        try {
          const userId = user.id
          const deviceId = await deviceApi.getMacAddress()

          const { data: licenses, error: licenseError } = await supabase
            .from('licenses')
            .select('id')
            .eq('user_id', userId)
            .in('status', ['active', 'trialing'])

          if (licenseError) {
            logError(`[DeviceReg] Error fetching license: ${JSON.stringify(licenseError, null, 2)}`)
          }
          const hasPaidLicense = !!licenses?.length
          const maxDevices = hasPaidLicense ? 3 : 1

          const { data: existingDevices, error: deviceError } = await deviceApi.getUserDevices(userId)

          if (deviceError) {
            logError(`[DeviceReg] Error fetching devices: ${JSON.stringify(deviceError, null, 2)}`)
            throw new Error('Failed to fetch devices')
          }
          const deviceCount = existingDevices?.length || 0

          const isCurrentDeviceRegistered = existingDevices?.some(d => d.device_id === deviceId)

          if (deviceCount >= maxDevices && !isCurrentDeviceRegistered) {
            setIsBlockedByDeviceLimit(true)
          } else {
            setIsBlockedByDeviceLimit(false)
            const rawHostname = await hostname()
            const deviceName = rawHostname ? deviceApi.cleanupHostname(rawHostname) : 'Unknown Device'
            await deviceApi.upsertDevice(userId, deviceId, deviceName)
          }

        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          logError(`[DeviceReg] Error during device registration check: ${message}`)
        } finally {
          isRegistering.current = false
        }
      }

      registerOrBlock()
    
    } else if (!authLoading && !user) {
      setIsBlockedByDeviceLimit(false)
      hasAttemptedRegistration.current = false
    }

  }, [authLoading, user, session, retryTrigger, isBlockedByDeviceLimit])

  return { isBlockedByDeviceLimit, retryDeviceRegistrationCheck }
} 
