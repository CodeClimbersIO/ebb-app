import { useLicenseStore } from '@/lib/stores/licenseStore'

export const usePermissions = () => {
  const { permissions } = useLicenseStore()

  return permissions
}

