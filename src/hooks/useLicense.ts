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

export interface LicenseInfo {
  license: License | null
  devices: LicenseDevice[]
  isLoading: boolean
  error: Error | null
  canUseHardDifficulty: boolean
  canUseAllowList: boolean
  canUseTypewriter: boolean
  canUseMultiplePresets: boolean
  isUpdateEligible: boolean
  isDeviceLimitReached: boolean
  currentDevice: LicenseDevice | null
}

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
  const storeLicense = useLicenseStore((state) => state.license)
  const isLoading = useLicenseStore((state) => state.isLoading)
  const error = useLicenseStore((state) => state.error)

  const license = transformLicense(storeLicense)

  const hasAccess = !isLoading && (storeLicense?.status === 'active' || storeLicense?.status === 'trialing')
  const isUpdateEligible = hasAccess && storeLicense && (
    storeLicense.license_type === 'subscription' ||
    (storeLicense.license_type === 'perpetual' &&
      !!storeLicense.expiration_date &&
      new Date(storeLicense.expiration_date) > new Date()
    )
  )

  return {
    license,
    devices: [],
    isLoading,
    error,
    currentDevice: null,
    isDeviceLimitReached: false,
    canUseHardDifficulty: hasAccess,
    canUseAllowList: hasAccess,
    canUseTypewriter: hasAccess,
    canUseMultiplePresets: hasAccess,
    isUpdateEligible,
  }
}
