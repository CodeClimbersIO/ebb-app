import { useEffect, useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { error as logError } from '@tauri-apps/plugin-log'
import { deviceApi } from '../api/ebbApi/deviceApi'
import { useLicense } from './useLicense'

export const useDeviceRegistration = () => {
  const { user, session, loading: authLoading } = useAuth()
  const { maxDevices } = useLicense()
  const [isBlockedByDeviceLimit, setIsBlockedByDeviceLimit] = useState(false)
  const [retryTrigger, setRetryTrigger] = useState(0)

  const checkRegistration = useCallback(() => {
    setRetryTrigger(count => count + 1)
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user || !session) return
    if (isBlockedByDeviceLimit) return

    const registerOrBlock = async () => {
      try {
        const isAtLimit = await deviceApi.registerDevice(user.id, maxDevices)
        if (isAtLimit) {
          setIsBlockedByDeviceLimit(true)
        } else {
          setIsBlockedByDeviceLimit(false)
        }

      } catch (err) {
        setIsBlockedByDeviceLimit(false)
        const message = err instanceof Error ? err.message : String(err)
        logError(`[DeviceReg] Error during device registration check: ${message}`)
      }
    }

    registerOrBlock()
  }, [authLoading, user, session, retryTrigger, isBlockedByDeviceLimit])

  return { isBlockedByDeviceLimit, checkRegistration }
} 
