import { useLicense as useContextLicense } from '@/contexts/LicenseContext'
import { License, LicenseInfo } from '@/lib/types/license'

export const useLicense = (): LicenseInfo => {
  const { license: contextLicense, isLoading } = useContextLicense()
  
  // Transform context license to match License type
  const license = contextLicense ? {
    id: contextLicense.id,
    userId: '', // This will be added in a future update
    status: contextLicense.status,
    licenseType: contextLicense.license_type,
    purchaseDate: new Date(),
    expirationDate: contextLicense.expiration_date ? new Date(contextLicense.expiration_date) : new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  } as License : null
  
  // Compute premium feature access flags
  const hasActiveLicense = !isLoading && contextLicense?.status === 'active'
  const isUpdateEligible = hasActiveLicense && (
    contextLicense?.license_type === 'subscription' || // subscription always gets updates while active
    (contextLicense?.license_type === 'perpetual' && new Date(contextLicense.expiration_date || '') > new Date()) // perpetual gets updates for 1 year
  )
  
  return {
    license,
    devices: [], // These will come from the context in a future update
    isLoading,
    error: null,
    currentDevice: null,
    isDeviceLimitReached: false,
    // Premium feature flags
    canUseHardDifficulty: hasActiveLicense,
    canUseAllowList: hasActiveLicense,
    canUseTypewriter: hasActiveLicense,
    canUseMultiplePresets: hasActiveLicense,
    isUpdateEligible
  }
} 
