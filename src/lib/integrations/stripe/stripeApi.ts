import supabase from '../supabase'
import { invoke } from '@tauri-apps/api/core'
export type LicenseType = 'perpetual' | 'subscription'

export class StripeApi {

  static async createCheckoutSession(licenseType: LicenseType): Promise<string> {
    const res = await supabase.functions.invoke('create-checkout', {
      method: 'POST',
      body: { licenseType }
    })
    if (res.error) {
      throw res.error
    }
    return res.data.url
  }

  static async startCheckout(licenseType: LicenseType): Promise<void> {
    try {
      const checkoutUrl = await this.createCheckoutSession(licenseType)
      await invoke('plugin:shell|open', { path: checkoutUrl })
    } catch (error) {
      const fullError = error instanceof Error ? error.message : String(error)
      console.error('Error starting checkout: -', JSON.stringify(fullError))
      console.error('Full checkout error: -', JSON.stringify(error))
      throw new Error(`Failed to start checkout: ${fullError}`)
    }
  }

} 
