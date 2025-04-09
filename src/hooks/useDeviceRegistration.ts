import { useEffect, useRef, useState, useCallback } from 'react'
import supabase from '@/lib/integrations/supabase'
import { hostname } from '@tauri-apps/plugin-os'
import { useAuth } from './useAuth'
import { invoke } from '@tauri-apps/api/core'

const getDeviceId = async (): Promise<string> => {
  console.log('Getting MAC address...')
  try {
    const macAddress = await invoke<string>('get_mac_address')
    console.log('Successfully retrieved MAC address:', macAddress)
    return macAddress
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('MAC Address Error:', errorMessage)
    throw new Error(`Device registration requires MAC address access: ${errorMessage}`)
  }
}

const cleanupHostname = (name: string): string => {
  return name
    .replace(/\.local$/, '')
    .replace(/-/g, ' ')
}

const upsertDevice = async (
  userId: string,
  deviceId: string,
  deviceName: string,
  log: (...args: unknown[]) => void,
  error: (...args: unknown[]) => void
) => {
  log(`[useDeviceReg] Upserting device: userId=${userId}, deviceId=${deviceId}`)
  const upsertData = {
    user_id: userId,
    device_id: deviceId,
    device_name: deviceName,
    last_active: new Date().toISOString()
  }

  const { error: upsertError } = await supabase
    .from('active_devices')
    .upsert(upsertData, { onConflict: 'user_id,device_id' })

  if (upsertError) {
    error('[useDeviceReg] Error upserting device:', JSON.stringify(upsertError, null, 2))
  } else {
    log('[useDeviceReg] Device upsert complete.')
  }
}

export const useDeviceRegistration = () => {
  const { user, session, loading: authLoading } = useAuth()
  const isRegistering = useRef(false)
  const hasAttemptedRegistration = useRef(false)
  const [isBlockedByDeviceLimit, setIsBlockedByDeviceLimit] = useState(false)
  const [retryTrigger, setRetryTrigger] = useState(0)

  const log = (...args: unknown[]) => console.log(...args)
  const error = (...args: unknown[]) => console.error(...args)

  const retryDeviceRegistrationCheck = useCallback(() => {
    log('[useDeviceReg] Retrying device registration check...')
    hasAttemptedRegistration.current = false
    setRetryTrigger(count => count + 1)
  }, [])

  useEffect(() => {
    if (!authLoading && user && session) {
      
      if (isBlockedByDeviceLimit || hasAttemptedRegistration.current) {
         log('[useDeviceReg] Skipping registration check (already blocked or attempted).')
         return
      }

      const registerOrBlock = async () => {
        if (isRegistering.current) {
          log('[useDeviceReg] Registration already in progress, skipping.')
          return
        }
        isRegistering.current = true
        hasAttemptedRegistration.current = true
        setIsBlockedByDeviceLimit(false)
        log('[useDeviceReg] Starting device registration check...')

        try {
          const userId = user.id
          const deviceId = await getDeviceId()
          log(`[useDeviceReg] User ID: ${userId}, Device ID: ${deviceId}`)

          log('[useDeviceReg] Checking for active license...')
          const { data: licenses, error: licenseError } = await supabase
            .from('licenses')
            .select('id')
            .eq('user_id', userId)
            .in('status', ['active', 'trialing'])

          if (licenseError) {
            error('[useDeviceReg] Error fetching license:', JSON.stringify(licenseError, null, 2))
          }
          const hasPaidLicense = !!licenses?.length
          const maxDevices = hasPaidLicense ? 3 : 1
          log(`[useDeviceReg] Max devices: ${maxDevices}`)

          log('[useDeviceReg] Checking existing devices...')
          const { data: existingDevices, error: deviceError } = await supabase
            .from('active_devices')
            .select('device_id, last_active')
            .eq('user_id', userId)
            .order('last_active', { ascending: true })

          if (deviceError) {
            error('[useDeviceReg] Error fetching devices:', JSON.stringify(deviceError, null, 2))
            throw new Error('Failed to fetch devices')
          }
          const deviceCount = existingDevices?.length || 0
          log(`[useDeviceReg] Found ${deviceCount} device(s).`)

          const isCurrentDeviceRegistered = existingDevices?.some(d => d.device_id === deviceId)

          if (deviceCount >= maxDevices && !isCurrentDeviceRegistered) {
             log(`[useDeviceReg] Device limit (${maxDevices}) reached for new device ${deviceId}. Blocking login.`)
             setIsBlockedByDeviceLimit(true)
          } else {
             log('[useDeviceReg] Device limit OK or device already registered. Proceeding with upsert...')
             setIsBlockedByDeviceLimit(false)
             const rawHostname = await hostname()
             const deviceName = rawHostname ? cleanupHostname(rawHostname) : 'Unknown Device'
             await upsertDevice(userId, deviceId, deviceName, log, error)
             log('[useDeviceReg] Device registration/update complete.')
          }

        } catch (err) {
          error('[useDeviceReg] Error during device registration check:', err)
        } finally {
          isRegistering.current = false
        }
      }

      registerOrBlock()
    
    } else if (!authLoading && !user) {
      setIsBlockedByDeviceLimit(false)
      hasAttemptedRegistration.current = false
      log('[useDeviceReg] User logged out, state reset.')
    }

  }, [authLoading, user, session, retryTrigger, isBlockedByDeviceLimit])

  return { isBlockedByDeviceLimit, retryDeviceRegistrationCheck }
} 
