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
  lastActive: Date
  createdAt: Date
}

export interface LicenseInfo {
  license: License | null
  devices: LicenseDevice[]
  isLoading: boolean
  error: Error | null
  // Premium feature access flags
  canUseHardDifficulty: boolean
  canUseAllowList: boolean
  canUseTypewriter: boolean
  canUseMultiplePresets: boolean
  isUpdateEligible: boolean
  // Device management
  isDeviceLimitReached: boolean
  currentDevice: LicenseDevice | null
} 
