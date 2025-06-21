import { useEffect } from 'react'
import { StripeApi } from '@/lib/integrations/stripe/stripeApi'
import { useAuth } from '@/hooks/useAuth'

export const useCheckout = () => {
  const {user} = useAuth()
  useEffect(() => {
    if(!user) return
    const checkoutIntent = localStorage.getItem('ebb_checkout_intent')
    if(!checkoutIntent) return
    StripeApi.startCheckout('perpetual')
    localStorage.removeItem('ebb_checkout_intent')
  }, [user])
  return 
}
