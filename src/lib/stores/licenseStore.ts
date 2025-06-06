import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { RealtimeChannel } from '@supabase/supabase-js'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { defaultPermissions, License, licenseApi, LicensePermissions } from '@/api/ebbApi/licenseApi'
import { DeviceInfo, defaultDeviceInfo } from '@/api/ebbApi/deviceApi'

interface LicenseStoreState {
  license: License | null
  permissions: LicensePermissions
  deviceInfo: DeviceInfo
  isLoading: boolean
  error: Error | null
  channel: RealtimeChannel | null
  fetchLicense: (userId: string | null) => Promise<void>
}

const defaultStoreState = {
  license: null,
  permissions: defaultPermissions,
  deviceInfo: defaultDeviceInfo,
  isLoading: true,
  error: null,
  channel: null,
}

export const useLicenseStore = create<LicenseStoreState>()(
  subscribeWithSelector(
    (set) => ({
      ...defaultStoreState,

      fetchLicense: async (userId: string | null) => {
        if (!userId) {
          set({ ...defaultStoreState, isLoading: false })
          return
        }
          
          
        try {
          set({ isLoading: true})
          const {data, error} = await licenseApi.getLicenseInfo(userId)

          if (error) {
            throw error
          }

          set({ ...defaultStoreState, license: data.license, permissions: data.permissions, deviceInfo: data.deviceInfo, isLoading: false })
        } catch (err) {
          logAndToastError(`Failed to fetch license status: ${err instanceof Error ? err.message : String(err)}`, err)
          set({ ...defaultStoreState, error: err instanceof Error ? err : new Error('Failed to fetch license') })
        }
      },
    })
  )
)
