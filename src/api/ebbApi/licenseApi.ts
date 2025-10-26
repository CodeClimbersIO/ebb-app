import { PostgrestError } from '@supabase/supabase-js'
import { licenseRepo } from '@/db/supabase/licenseRepo'
import { DeviceInfo } from '@/api/ebbApi/deviceApi'
import { platformApiRequest } from '../platformRequest'
import { DateTime } from 'luxon'

export type LicenseStatus = 'active' | 'expired'
export type LicenseType = 'perpetual' | 'subscription' | 'free_trial'
export interface RawLicense {
  id: string
  status: string
  license_type: LicenseType
  expiration_date: string | null
}
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
  canUseMultipleProfiles: boolean
  canUseMultipleDevices: boolean
  canUseSmartFocus: boolean
  canUseSlackIntegration: boolean
  canScheduleSessions: boolean
  hasProAccess: boolean
}

export type LicenseInfo = {
  license: License | null
  permissions: LicensePermissions
  deviceInfo: DeviceInfo
}

export const defaultPermissions: LicensePermissions = {
  canUseHardDifficulty: false,
  canUseAllowList: false,
  canUseMultipleProfiles: false,
  canUseMultipleDevices: false,
  canUseSmartFocus: false,
  canUseSlackIntegration: false,
  canScheduleSessions: false,
  hasProAccess: false,
}

const transformLicense = (rawLicense: RawLicense | null): License | null => {
  if (!rawLicense) return null
  return {
    id: rawLicense.id,
    userId: '',
    status: rawLicense.status as 'active' | 'expired',
    licenseType: rawLicense.license_type,
    purchaseDate: new Date(),
    expirationDate: rawLicense.expiration_date ? new Date(rawLicense.expiration_date) : new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    stripeCustomerId: undefined,
    stripePaymentId: undefined,
  }
}

const calculatePermissions = (license: License | null): LicensePermissions | null => {
  if (!license) return null
  let hasProAccess = license?.status === 'active'

  if (license.licenseType === 'free_trial' && DateTime.fromJSDate(license.expirationDate) < DateTime.now()) {
    hasProAccess = false
  }

  return {
    canUseHardDifficulty: hasProAccess,
    canUseAllowList: hasProAccess,
    canUseMultipleProfiles: hasProAccess,
    canUseMultipleDevices: hasProAccess,
    canUseSmartFocus: hasProAccess,
    canUseSlackIntegration: hasProAccess,
    canScheduleSessions: hasProAccess,
    hasProAccess,
  }
}

const getLicenseInfo = async (userId: string): Promise<{data: LicenseInfo, error: PostgrestError | null}> => {
  const {data, error} = await licenseRepo.getLicense(userId)
  const license = transformLicense(data)
  const permissions = calculatePermissions(license) || defaultPermissions
  const deviceInfo: DeviceInfo = {
    devices: [],
    isDeviceLimitReached: false,
  }
  
  return {data: {license, permissions, deviceInfo }, error}
}

export interface StartTrialResponse {
  success: boolean
  message: string
}

export interface CancelLicenseResponse {
  success: boolean
  message: string
  data?: {
    license_id: number
    stripe_subscription_id: string
    canceled_at: number
    cancel_at_period_end: boolean
  }
}

const startTrial = async (): Promise<StartTrialResponse> => {
  const response = await platformApiRequest({
    url: '/api/license/start-trial',
    method: 'POST'
  })
  return response as StartTrialResponse
}

const cancelLicense = async (): Promise<CancelLicenseResponse> => {
  const response = await platformApiRequest({
    url: '/api/license/cancel',
    method: 'POST'
  })
  return response as CancelLicenseResponse
}

export const licenseApi = {
  getLicenseInfo,
  calculatePermissions,
  startTrial,
  cancelLicense,
}

