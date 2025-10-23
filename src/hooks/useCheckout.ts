import { useEffect } from 'react'
import { StripeApi, type LicenseType } from '@/lib/integrations/stripe/stripeApi'
import { useAuth } from '@/hooks/useAuth'

export const useCheckout = () => {
  const {user} = useAuth()
  useEffect(() => {
    if(!user) return
    const checkoutIntent = localStorage.getItem('ebb_checkout_intent')
    if(!checkoutIntent) return

    const licenseType = (localStorage.getItem('ebb_license_type') as LicenseType) || 'annual_subscription'

    StripeApi.startCheckout(licenseType)
    localStorage.removeItem('ebb_checkout_intent')
    localStorage.removeItem('ebb_license_type')
  }, [user])
  return
}
