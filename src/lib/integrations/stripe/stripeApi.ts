import supabase from '../supabase'
import { invoke } from '@tauri-apps/api/core'
    
export type LicenseType = 'perpetual' | 'subscription'

export class StripeApi {
  static async createCheckoutSession(licenseType: LicenseType): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No active session')
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ licenseType })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create checkout session')
    }

    const { url } = await response.json()
    if (!url) {
      throw new Error('No checkout URL returned')
    }

    return url
  }

  static async startCheckout(licenseType: LicenseType): Promise<void> {
    try {
      const checkoutUrl = await this.createCheckoutSession(licenseType)
      await invoke('open_url', { url: checkoutUrl })
    } catch (error) {
      console.error('Error starting checkout:', error)
      throw error
    }
  }
} 
