import * as React from 'react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { KeyRound } from 'lucide-react'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { StripeApi } from '@/lib/integrations/stripe/stripeApi'
import { useAuth } from '@/hooks/useAuth'
import { isDev } from '../lib/utils/environment.util'
import supabase from '../lib/integrations/supabase'
import { invoke } from '@tauri-apps/api/core'

interface PaywallDialogProps {
  children: React.ReactNode
}

const users = [
  { name: 'Samantha', image: '/images/avatars/samantha.jpg', initials: 'S' },
  { name: 'Paul', image: '/images/avatars/paul.jpg', initials: 'P' },
  { name: 'Think', image: '/images/avatars/think.jpg', initials: 'T' },
  { name: 'Nathan', image: '/images/avatars/nathan.jpg', initials: 'N' },
  { name: 'Dude', image: '/images/avatars/dude.jpg', initials: 'D' }
]

export function PaywallDialog({ children }: PaywallDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const handleGoogleLogin = async () => {
    try {
      // Store checkout intent in localStorage before auth
      localStorage.setItem('ebb_checkout_intent', 'true')
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
      await StripeApi.startCheckout('perpetual')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(message)
      logAndToastError(`Checkout failed: ${error}`, error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="space-y-2">
          <div className="flex justify-center mb-3">
            <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-0">
              <KeyRound className="h-3 w-3 mr-1" />
              Ebb Pro
            </Badge>
          </div>
          <div className="text-center">
            <DialogTitle className="text-3xl font-bold mb-2">
              Pay once
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your copy forever & one year of updates
            </p>
          </div>
        </DialogHeader>
        
        {/* Price Section */}
        <div className="text-center mt-2">
          <div className="flex items-baseline justify-center">
            <span className="text-3xl font-bold">$37</span>
            <span className="text-sm text-muted-foreground ml-2">one-time</span>
          </div>
        </div>

        {/* CTA Button */}
        <RainbowButton 
          className="w-full mt-3"
          onClick={handleCheckout}
          disabled={isLoading}
        >
          {isLoading ? 'Opening Browser...' : 'Get Pro License'}
        </RainbowButton>
        
        {error && (
          <p className="text-center text-xs text-red-500 mt-2">{error}</p>
        )}

        {/* Social Proof */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="flex -space-x-2">
            {users.map((user, index) => (
              <Avatar key={index} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">Join thousands of pros</span>
        </div>

        {/* Features List */}
        <div className="grid grid-cols-2 gap-2 text-sm mt-4">
          <div className="flex items-center">
            <svg className="h-4 w-4 text-primary mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>6 focus profiles</span>
          </div>
          <div className="flex items-center">
            <svg className="h-4 w-4 text-primary mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Hard difficulty</span>
          </div>
          <div className="flex items-center">
            <svg className="h-4 w-4 text-primary mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Typewriter mode</span>
          </div>
          <div className="flex items-center">
            <svg className="h-4 w-4 text-primary mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Allow list</span>
          </div>
          <div className="flex items-center">
            <svg className="h-4 w-4 text-primary mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>3 macOS devices</span>
          </div>
          <div className="flex items-center">
            <svg className="h-4 w-4 text-primary mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>1 year of updates</span>
          </div>
        </div>

        {/* Money-back guarantee */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          30-day money-back guarantee
        </p>
      </DialogContent>
    </Dialog>
  )
}
