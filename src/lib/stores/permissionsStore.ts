import { create } from 'zustand'
import {defaultPermissions, LicensePermissions } from '@/api/ebbApi/licenseApi'

interface PermissionsStore {
  permissions: LicensePermissions
  setPermissions: (permissions: LicensePermissions) => void
}

export const usePermissionsStore = create<PermissionsStore>((set) => ({
  permissions: defaultPermissions,
  setPermissions: (permissions) => set({ permissions }),
}))
