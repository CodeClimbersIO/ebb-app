import { useLicenseWithDevices } from '@/api/hooks/useLicense'
import { useAuth } from './useAuth'
import { defaultPermissions } from '@/api/ebbApi/licenseApi'
import { usePermissionsStore } from '@/lib/stores/permissionsStore'
import { useEffect } from 'react'

export const usePermissions = () => {
  const { user } = useAuth()
  const { data: licenseData } = useLicenseWithDevices(user?.id || null)
  const setPermissions = usePermissionsStore((state) => state.setPermissions)

  const permissions = licenseData?.permissions || defaultPermissions

  // Sync to store whenever permissions change
  useEffect(() => {
    setPermissions(permissions)
  }, [permissions, setPermissions])

  return permissions
}
