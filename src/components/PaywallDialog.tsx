import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { KeyRound, Layers, Shield, Calendar, MessageSquare, Eye, BarChart3 } from 'lucide-react'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { StripeApi } from '@/lib/integrations/stripe/stripeApi'
import { useAuth } from '@/hooks/useAuth'
import { isDev } from '../lib/utils/environment.util'
import supabase from '../lib/integrations/supabase'
import { invoke } from '@tauri-apps/api/core'
import { usePaywall } from '@/hooks/usePaywall'
import { useLicenseWithDevices } from '@/api/hooks/useLicense'
import { cn } from '@/lib/utils/tailwind.util'

const users = [
  { name: 'Samantha', image: '/images/avatars/samantha.jpg', initials: 'S' },
  { name: 'Paul', image: '/images/avatars/paul.jpg', initials: 'P' },
  { name: 'Think', image: '/images/avatars/think.jpg', initials: 'T' },
  { name: 'Nathan', image: '/images/avatars/nathan.jpg', initials: 'N' },
  { name: 'Dude', image: '/images/avatars/dude.jpg', initials: 'D' }
]

type BillingPeriod = 'monthly' | 'annual'

export function PaywallDialog() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual')
  const { user } = useAuth()
  const { isOpen, closePaywall } = usePaywall()
  const { data: licenseData } = useLicenseWithDevices(user?.id || null)

  const hasTrial = licenseData?.license?.licenseType === 'free_trial'
  const hasProAccess = licenseData?.permissions?.hasProAccess || false

  const handleGoogleLogin = async () => {
    try {
      // Store checkout intent and license type in localStorage before auth
      const licenseType = billingPeriod === 'monthly' ? 'monthly_subscription' : 'annual_subscription'
      localStorage.setItem('ebb_checkout_intent', 'true')
      localStorage.setItem('ebb_license_type', licenseType)
      setIsLoading(true)
      const redirectUrl = isDev()
        ? 'http://localhost:1420/auth-success'
        : 'https://ebb.cool/auth-success'
      
      const { data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: true,
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (!data?.url) throw new Error('No auth URL returned')
      
      if (isDev()) {
        window.location.href = data.url
      } else {
        await invoke('plugin:shell|open', { path: data.url })
      }
    } catch (err) {
      setError('Failed to login with Google.')
      logAndToastError(`${err}`, error)
    }
    setIsLoading(false)
  }

  const handleCheckout = async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (!user) {
        await handleGoogleLogin()
        return
      }
      const licenseType = billingPeriod === 'monthly' ? 'monthly_subscription' : 'annual_subscription'
      await StripeApi.startCheckout(licenseType)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(message)
      logAndToastError(`Checkout failed: ${error}`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const monthlyPrice = 9
  const annualPrice = 60 // $5/month * 12
  const annualMonthlyRate = 5

  const ctaText = hasTrial ? 'Upgrade Now' : 'Get Started'

  return (
    <Dialog open={isOpen} onOpenChange={closePaywall}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-0">
              <KeyRound className="h-3 w-3 mr-1" />
              Ebb Pro
            </Badge>
          </div>
          <div className="text-center">
            <DialogTitle className="text-2xl font-bold">
              Upgrade to Pro
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Billing Period Toggle */}
        <div className="flex items-center justify-center gap-3">
          <span className={cn(
            'text-sm font-medium transition-colors',
            billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'
          )}>
            Monthly
          </span>
          <Switch
            checked={billingPeriod === 'annual'}
            onCheckedChange={(checked) => setBillingPeriod(checked ? 'annual' : 'monthly')}
          />
          <span className={cn(
            'text-sm font-medium transition-colors',
            billingPeriod === 'annual' ? 'text-foreground' : 'text-muted-foreground'
          )}>
            Annual
          </span>
        </div>

        {/* Price Display */}
        <div className="text-center mt-4 relative">
          <div className="text-4xl font-bold">
            ${billingPeriod === 'annual' ? annualMonthlyRate : monthlyPrice}
            <span className="text-xl text-muted-foreground">/month</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {billingPeriod === 'annual'
              ? `Billed annually at $${annualPrice}`
              : 'All pro features included'}
          </p>
          <p className="text-sm font-semibold mt-1 min-h-[20px]">
            {billingPeriod === 'annual' && (
              <span className="text-primary-600">
                Save ${(monthlyPrice * 12) - annualPrice}/year
              </span>
            )}
          </p>
        </div>

        {/* CTA Button */}
        <RainbowButton
          className="w-full mt-4"
          onClick={handleCheckout}
          disabled={isLoading}
        >
          {isLoading ? 'Opening Browser...' : ctaText}
        </RainbowButton>

        {error && (
          <p className="text-center text-xs text-red-500 mt-2">{error}</p>
        )}

        {/* Features List */}
        <div className="mt-4">
          <div className="text-sm font-semibold mb-2">What's included:</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary shrink-0" />
              <span>Hands-Free Time Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary shrink-0" />
              <span>Site & App Blocking</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary shrink-0" />
              <span>Slack & Spotify</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <span>Schedule Sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary shrink-0" />
              <span>Doomscroll Detection</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary shrink-0" />
              <span>Multiple Profiles</span>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t">
          <div className="flex -space-x-2">
            {users.map((user, index) => (
              <Avatar key={index} className="h-5 w-5 border-2 border-background">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="text-[10px]">{user.initials}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">Join thousands of pros</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
