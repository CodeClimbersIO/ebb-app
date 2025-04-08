import { useEffect, useRef, useState, useCallback } from 'react'
import supabase from '@/lib/integrations/supabase'
import { hostname } from '@tauri-apps/plugin-os'
import { useAuth } from './useAuth' // Import the simplified useAuth

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

// Helper function to upsert device information
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
    // We might not want to throw here, just log the error
    // Throwing could prevent other parts of the app from loading if device registration fails
    // Consider how critical device registration is vs. basic app function
  } else {
    log('[useDeviceReg] Device upsert complete.')
  }
}

export const useDeviceRegistration = () => {
  const { user, session, loading: authLoading } = useAuth()
  const isRegistering = useRef(false)
  const hasAttemptedRegistration = useRef(false) // Track if registration attempt occurred
  const [isBlockedByDeviceLimit, setIsBlockedByDeviceLimit] = useState(false)
  const [retryTrigger, setRetryTrigger] = useState(0) // State to trigger re-check

  const log = (...args: unknown[]) => console.log(...args)
  const error = (...args: unknown[]) => console.error(...args)

  // Function to allow external trigger of the check
  const retryDeviceRegistrationCheck = useCallback(() => {
    log('[useDeviceReg] Retrying device registration check...')
    hasAttemptedRegistration.current = false // Allow re-attempt
    setRetryTrigger(count => count + 1)
  }, [])

  useEffect(() => {
    // Only run if auth is loaded, we have a user/session
    if (!authLoading && user && session) {
      
      // Prevent re-running if already blocked or already registered in this effect cycle
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
        hasAttemptedRegistration.current = true // Mark that we've started this attempt
        setIsBlockedByDeviceLimit(false) // Assume not blocked initially for this check
        log('[useDeviceReg] Starting device registration check...')

        try {
          const userId = user.id
          const deviceId = getOrCreateDeviceId()
          log(`[useDeviceReg] User ID: ${userId}, Device ID: ${deviceId}`)

          // Fetch license & Determine limit
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

          // Fetch Existing Devices
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

          // Handle Device Limit or Register
          if (deviceCount >= maxDevices && !isCurrentDeviceRegistered) {
             // Limit reached AND this is a new/unregistered device
             log(`[useDeviceReg] Device limit (${maxDevices}) reached for new device ${deviceId}. Blocking login.`)
             setIsBlockedByDeviceLimit(true) // BLOCK
             // DO NOT proceed to upsert
          } else {
             // Limit not reached OR this device is already registered
             log('[useDeviceReg] Device limit OK or device already registered. Proceeding with upsert...')
             setIsBlockedByDeviceLimit(false) // Ensure not blocked
             const rawHostname = await hostname() // Get hostname here if needed for upsert
             const deviceName = rawHostname ? cleanupHostname(rawHostname) : 'Unknown Device'
             await upsertDevice(userId, deviceId, deviceName, log, error)
             log('[useDeviceReg] Device registration/update complete.')
          }

        } catch (err) {
          error('[useDeviceReg] Error during device registration check:', err)
          // Potentially set an error state here if needed
        } finally {
          isRegistering.current = false
        }
      }

      registerOrBlock()
    
    } else if (!authLoading && !user) {
      // Reset state if user logs out
      setIsBlockedByDeviceLimit(false)
      hasAttemptedRegistration.current = false
      log('[useDeviceReg] User logged out, state reset.')
    }

  }, [authLoading, user, session, retryTrigger, isBlockedByDeviceLimit]) // Add retryTrigger and isBlockedByDeviceLimit

  // Expose the block state and the retry function
  return { isBlockedByDeviceLimit, retryDeviceRegistrationCheck }
} 
