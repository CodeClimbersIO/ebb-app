import { useQuery } from '@tanstack/react-query'
import { defaultPermissions, License, licenseApi, LicensePermissions } from '@/api/ebbApi/licenseApi'
import { useRegisterDevice, DeviceInfo, defaultDeviceInfo } from './useDevice'

export interface LicenseInfo {
  license: License | null
  permissions: LicensePermissions
  deviceInfo: DeviceInfo
}

const licenseKeys = {
  all: ['license'] as const,
  info: (userId: string) => [...licenseKeys.all, 'info', userId] as const,
}

const fetchLicenseInfo = async (userId: string): Promise<LicenseInfo> => {
  const { data, error } = await licenseApi.getLicenseInfo(userId)
  
  if (error) {
    throw error
  }
  
  return data
}

export function useGetLicenseInfo(userId: string | null) {
  return useQuery({
    queryKey: licenseKeys.info(userId || ''),
    queryFn: () => fetchLicenseInfo(userId!),
    enabled: !!userId,
  })
}

export function useLicenseWithDevices(userId: string | null) {
  const { data: licenseData, isLoading: licenseLoading, error: licenseError } = useGetLicenseInfo(userId)
  const { data: deviceInfo, isLoading: deviceLoading, error: deviceError } = useRegisterDevice(
    userId || '', 
    licenseData?.permissions.maxDevices || 1
  )

  const isLoading = licenseLoading || deviceLoading
  const error = licenseError || deviceError

  const combinedData: LicenseInfo = {
    license: licenseData?.license || null,
    permissions: licenseData?.permissions || defaultPermissions,
    deviceInfo: deviceInfo || defaultDeviceInfo,
  }

  return {
    data: combinedData,
    isLoading,
    error,
  }
} 
