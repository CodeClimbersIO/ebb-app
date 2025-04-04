import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import supabase from '@/lib/integrations/supabase'
import { invoke } from '@tauri-apps/api/core'
import { License, LicenseDevice, LicenseInfo } from '@/lib/types/license'
import { error as logError } from '@tauri-apps/plugin-log'

const MAX_DEVICES = 3
const DEVICE_ID_KEY = 'ebb_device_id'

const getOrCreateDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

const getDeviceName = async (): Promise<string> => {
  try {
    // Try to get the device name from the OS
    const osInfo = await invoke<string>('os_info')
    return osInfo || 'Unknown Device'
  } catch (error) {
    console.error('Failed to get device name:', error)
    return 'Unknown Device'
  }
}

export const useLicense = (): LicenseInfo => {
  const { user } = useAuth()
  const [license, setLicense] = useState<License | null>(null)
  const [devices, setDevices] = useState<LicenseDevice[]>([])
  const [currentDevice, setCurrentDevice] = useState<LicenseDevice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchLicenseInfo = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch license
        const { data: licenseData, error: licenseError } = await supabase
          .from('licenses')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (licenseError) throw licenseError

        // Fetch devices if license exists
        if (licenseData) {
          const { data: devicesData, error: devicesError } = await supabase
            .from('license_devices')
            .select('*')
            .eq('license_id', licenseData.id)
            .order('last_active', { ascending: false })

          if (devicesError) throw devicesError

          // Parse dates
          const license: License = {
            ...licenseData,
            purchaseDate: new Date(licenseData.purchase_date),
            expirationDate: new Date(licenseData.expiration_date),
            createdAt: new Date(licenseData.created_at),
            updatedAt: new Date(licenseData.updated_at)
          }

          const devices: LicenseDevice[] = devicesData.map(d => ({
            ...d,
            lastActive: new Date(d.last_active),
            createdAt: new Date(d.created_at)
          }))

          setLicense(license)
          setDevices(devices)

          // Handle current device registration
          const deviceId = getOrCreateDeviceId()
          const existingDevice = devices.find(d => d.deviceId === deviceId)

          if (existingDevice) {
            // Update last_active
            const { error: updateError } = await supabase
              .from('license_devices')
              .update({ last_active: new Date().toISOString() })
              .eq('id', existingDevice.id)

            if (updateError) throw updateError
            setCurrentDevice(existingDevice)
          } else if (devices.length < MAX_DEVICES) {
            // Register new device
            const deviceName = await getDeviceName()
            const { data: newDevice, error: createError } = await supabase
              .from('license_devices')
              .insert({
                license_id: license.id,
                device_id: deviceId,
                device_name: deviceName
              })
              .select()
              .single()

            if (createError) throw createError
            setCurrentDevice(newDevice)
            setDevices([...devices, newDevice])
          }
        }

        setIsLoading(false)
      } catch (err) {
        const error = err as Error
        setError(error)
        setIsLoading(false)
        logError(`License info fetch error: ${error.message}`)
      }
    }

    fetchLicenseInfo()
  }, [user])

  // Compute premium feature access flags
  const hasActiveLicense = license?.status === 'active'
  const isUpdateEligible = hasActiveLicense && (
    license?.licenseType === 'subscription' || // subscription always gets updates while active
    (license?.licenseType === 'perpetual' && new Date() <= license.expirationDate) // perpetual gets updates for 1 year
  )
  
  return {
    license,
    devices,
    isLoading,
    error,
    currentDevice,
    isDeviceLimitReached: devices.length >= MAX_DEVICES,
    // Premium feature flags
    canUseHardDifficulty: hasActiveLicense,
    canUseAllowList: hasActiveLicense,
    canUseTypewriter: hasActiveLicense,
    canUseMultiplePresets: hasActiveLicense,
    isUpdateEligible
  }
} 
