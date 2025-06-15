import { useLicenseWithDevices } from '@/api/hooks/useLicense'
import { useAuth } from './useAuth'
import { defaultPermissions } from '@/api/ebbApi/licenseApi'

export const usePermissions = () => {
  const { user } = useAuth()
  const { data: licenseData } = useLicenseWithDevices(user?.id || null)

  return licenseData?.permissions || defaultPermissions
}

