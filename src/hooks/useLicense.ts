import { useLicenseStore, License as StoreLicense } from '@/stores/licenseStore'

export type LicenseStatus = 'active' | 'expired'
export type LicenseType = 'perpetual' | 'subscription'

export interface License {
  id: string
  userId: string
  status: LicenseStatus
  licenseType: LicenseType
  purchaseDate: Date
  expirationDate: Date
  stripeCustomerId?: string
  stripePaymentId?: string
  createdAt: Date
  updatedAt: Date
}

export interface LicenseDevice {
  id: string
  licenseId: string
  deviceId: string
  deviceName: string
  createdAt: Date
}

export interface LicensePermissions {
  canUseHardDifficulty: boolean
  canUseAllowList: boolean
  canUseTypewriter: boolean
  canUseMultipleProfiles: boolean
  canUseMultipleDevices: boolean
  hasProAccess: boolean
  maxDevicesToShow: number
}

export type LicenseInfo = {
  license: License | null
  devices: LicenseDevice[]
  isLoading: boolean
  error: Error | null
  isUpdateEligible: boolean
  isDeviceLimitReached: boolean
  currentDevice: LicenseDevice | null
} & LicensePermissions

const transformLicense = (storeLicense: StoreLicense | null): License | null => {
  if (!storeLicense) {
    return null
  }
  return {
    id: storeLicense.id,
    userId: '',
    status: storeLicense.status as 'active' | 'expired',
    licenseType: storeLicense.license_type,
    purchaseDate: new Date(),
    expirationDate: storeLicense.expiration_date ? new Date(storeLicense.expiration_date) : new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    stripeCustomerId: undefined,
    stripePaymentId: undefined,
  }
}

export const useLicense = (): LicenseInfo => {
  const { license: storeLicense, isLoading, error } = useLicenseStore()

  const license = transformLicense(storeLicense)

  const hasProAccess = !isLoading && (storeLicense?.status === 'active' || storeLicense?.status === 'trialing')
  const isUpdateEligible = hasProAccess && storeLicense && (
    storeLicense.license_type === 'subscription' ||
    (storeLicense.license_type === 'perpetual' &&
      !!storeLicense.expiration_date &&
      new Date(storeLicense.expiration_date) > new Date()
    )
  )

  const permissions = {
    canUseHardDifficulty: hasProAccess,
    canUseAllowList: hasProAccess,
    canUseTypewriter: hasProAccess,
    canUseMultipleProfiles: hasProAccess,
    canUseMultipleDevices: hasProAccess,
    hasProAccess,
    maxDevicesToShow: hasProAccess ? 3 : 1,
  }

  return {
    license,
    devices: [],
    isLoading,
    error,
    currentDevice: null,
    isDeviceLimitReached: false,
    ...permissions,
    isUpdateEligible,
  }
}
