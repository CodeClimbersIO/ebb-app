import { invoke } from '@tauri-apps/api/core'
import { platformApiRequest } from '@/api/platformRequest'

export type LicenseType = 'monthly_subscription' | 'annual_subscription'

interface CheckoutResponse {
  success: boolean
  data: {
    url: string
  }
}

export class StripeApi {

  static async startCheckout(licenseType: LicenseType): Promise<void> {
    try {
      // Call backend checkout API
      const response = await platformApiRequest({
        url: '/api/checkout/create',
        method: 'POST',
        body: { licenseType }
      }) as CheckoutResponse

      if (!response.success || !response.data?.url) {
        throw new Error('Failed to create checkout session')
      }

      // Open Stripe checkout URL
      await invoke('plugin:shell|open', { path: response.data.url })
    } catch (error) {
      const fullError = error instanceof Error ? error.message : String(error)
      console.error('Error starting checkout: -', JSON.stringify(fullError))
      console.error('Full checkout error: -', JSON.stringify(error))
      throw new Error(`Failed to start checkout: ${fullError}`)
    }
  }

} 
