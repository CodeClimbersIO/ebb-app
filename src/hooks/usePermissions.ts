import { useLicenseWithDevices } from '@/api/hooks/useLicense'
import { useAuth } from './useAuth'
import { defaultPermissions } from '@/api/ebbApi/licenseApi'
import { usePermissionsStore } from '@/lib/stores/permissionsStore'
import { useEffect } from 'react'
import { isDev } from '@/lib/utils/environment.util'

const devPermissions = {
  canUseHardDifficulty: true,
  canUseAllowList: true,
  canUseMultipleProfiles: true,
  canUseMultipleDevices: true,
  canUseSmartFocus: true,
  canUseSlackIntegration: true,
  canScheduleSessions: true,
  hasProAccess: true,
}

export const usePermissions = () => {
  const { user } = useAuth()
  const { data: licenseData } = useLicenseWithDevices(user?.id || null)
  const setPermissions = usePermissionsStore((state) => state.setPermissions)

  // In dev mode, grant all pro permissions
  const isDevMode = isDev()
  console.log('[usePermissions] isDev:', isDevMode, 'import.meta.env.DEV:', import.meta.env.DEV)

  const permissions = isDevMode
    ? devPermissions
    : (licenseData?.permissions || defaultPermissions)

  console.log('[usePermissions] permissions:', permissions)

  // Sync to store whenever permissions change
  useEffect(() => {
    setPermissions(permissions)
  }, [permissions, setPermissions])

  return permissions
}
