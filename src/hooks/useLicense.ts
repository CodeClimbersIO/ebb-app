import { useLicenseStore, License as StoreLicense } from '@/stores/licenseStore'
import { License, LicenseInfo } from '@/lib/types/license'

// Mapping from store license type to the more detailed application License type
const transformLicense = (storeLicense: StoreLicense | null): License | null => {
  if (!storeLicense) {
    return null
  }
  return {
    id: storeLicense.id,
    userId: '', // Placeholder - userId is managed in auth context
    status: storeLicense.status as 'active' | 'expired', // Assuming store status maps directly for now
    licenseType: storeLicense.license_type,
    purchaseDate: new Date(), // Placeholder - not in store
    expirationDate: storeLicense.expiration_date ? new Date(storeLicense.expiration_date) : new Date(), // Handled
    createdAt: new Date(), // Placeholder - not in store
    updatedAt: new Date(), // Placeholder - not in store
    stripeCustomerId: undefined, // Placeholder - not in store
    stripePaymentId: undefined, // Placeholder - not in store
  }
}

export const useLicense = (): LicenseInfo => {
  const storeLicense = useLicenseStore((state) => state.license)
  const isLoading = useLicenseStore((state) => state.isLoading)
  const error = useLicenseStore((state) => state.error)

  const license = transformLicense(storeLicense)

  // Compute premium feature access flags based on the store license data
  // NOTE: We now check for 'active' or 'trialing' for access, as per the store logic
  const hasAccess = !isLoading && (storeLicense?.status === 'active' || storeLicense?.status === 'trialing')
  const isUpdateEligible = hasAccess && storeLicense && (
    storeLicense.license_type === 'subscription' || // Subscription always gets updates while active
    (storeLicense.license_type === 'perpetual' &&
      !!storeLicense.expiration_date && // Explicit boolean check for existence
      new Date(storeLicense.expiration_date) > new Date() // Perpetual gets updates for 1 year from purchase (represented by expiration_date)
    )
  )

  return {
    license, // The transformed license object
    devices: [], // Placeholder - Device info is not in the license store yet
    isLoading,
    error,
    currentDevice: null, // Placeholder
    isDeviceLimitReached: false, // Placeholder
    // Premium feature flags derived from store license status
    canUseHardDifficulty: hasAccess,
    canUseAllowList: hasAccess,
    canUseTypewriter: hasAccess,
    canUseMultiplePresets: hasAccess,
    isUpdateEligible,
  }
} 
