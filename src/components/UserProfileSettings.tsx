import { AnalyticsButton } from '@/components/ui/analytics-button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { LogOut, KeyRound, User as UserIcon } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { User } from '@supabase/supabase-js'
import supabase from '@/lib/integrations/supabase'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useLicenseWithDevices } from '@/api/hooks/useLicense'
import { invoke } from '@tauri-apps/api/core'
import { isDev } from '@/lib/utils/environment.util'
import { usePaywall } from '@/hooks/usePaywall'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { AnalyticsService } from '@/lib/analytics'

interface UserProfileSettingsProps {
  user: User | null
}

export function UserProfileSettings({ user }: UserProfileSettingsProps) {
  const { hasProAccess } = usePermissions()
  const { data: licenseData, isLoading } = useLicenseWithDevices(user?.id || null)
  const license = licenseData?.license
  const { openPaywall } = usePaywall()

  const { logout } = useAuth()

  // Check license type
  const isFreeTrial = license?.licenseType === 'free_trial'
  const isActiveSubscription = license?.licenseType === 'subscription'
  const daysRemaining = license?.expirationDate
    ? differenceInDays(new Date(license.expirationDate), new Date())
    : 0

  const handleUpgradeClick = () => {
    AnalyticsService.trackEvent('upgrade_now_clicked', {
      button_location: 'user_profile_settings',
      days_remaining: daysRemaining
    })
    openPaywall()
  }

  const handleManageSubscription = async () => {
    try {
      AnalyticsService.trackEvent('manage_subscription_clicked', {
        button_location: 'user_profile_settings'
      })

      const portalUrl = isDev()
        ? 'https://billing.stripe.com/p/login/test_aFaeVc2Fn2e08mqg9MeEo00'
        : 'https://billing.stripe.com/p/login/aFaeVc2Fn2e08mqg9MeEo00'

      if (isDev()) {
        window.location.href = portalUrl
      } else {
        await invoke('plugin:shell|open', { path: portalUrl })
      }
    } catch (error) {
      logAndToastError(`Failed to open billing portal: ${error}`, error)
    }
  }

  const handleLogout = async () => {
    const { error } = await logout()
    if (error) {
      logAndToastError(`Error logging out: ${error.message}`, error)
    }

    window.location.reload()
  }

  const handleGoogleLogin = async () => {
    try {
      const { data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: true,
          redirectTo: isDev()
            ? 'http://localhost:1420/auth-success'
            : 'https://ebb.cool/auth-success',
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
      logAndToastError(`Failed to login with Google: ${err}`, err)
    }
  }

  // Guest user UI
  if (!user) {
    return (
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-muted">
                  <UserIcon className="h-6 w-6 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-muted-foreground">Guest User</h2>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>Connect for friends and community features</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AnalyticsButton 
              analyticsEvent='user_profile_settings_login_with_google_clicked'
              variant="outline" 
              size="sm" 
              onClick={handleGoogleLogin}
              className="flex items-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
              </svg>
              Login with Google
            </AnalyticsButton>
          </div>
        </div>
      </div>
    )
  }

  // Authenticated user UI
  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>
                {(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -left-1 bg-background p-0.5 rounded-full">
              {isLoading ? (
                <KeyRound className="h-5 w-5 text-muted-foreground animate-pulse" />
              ) : hasProAccess ? (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <KeyRound className="h-5 w-5 text-yellow-500 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Status: {license?.status}</p>
                      {license?.licenseType && <p>Type: {license.licenseType}</p>}
                      {license?.expirationDate && <p>Updates until: {format(new Date(license.expirationDate), 'PP')}</p>}
                      {license?.licenseType === 'subscription' && (
                        <AnalyticsButton 
                          analyticsEvent='user_profile_settings_manage_subscription_clicked'
                          size="sm" 
                          variant="outline" 
                          onClick={handleManageSubscription} 
                          className="mt-2 w-full"
                        >Manage Subscription</AnalyticsButton>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <KeyRound
                  className="h-5 w-5 text-muted-foreground hover:text-yellow-500 cursor-pointer"
                  onClick={openPaywall}
                />
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
            </h2>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>{user?.email}</span>
              <GoogleIcon className="h-3.5 w-3.5" />
            </div>
            {isFreeTrial && (
              <div className="text-sm text-muted-foreground text-primary-400 mt-1">
                {daysRemaining > 0
                  ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining on free trial`
                  : 'Free trial expired'}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isFreeTrial && (
            <RainbowButton onClick={handleUpgradeClick} className="h-9">
              Upgrade Now
            </RainbowButton>
          )}
          {isActiveSubscription && (
            <AnalyticsButton
              analyticsEvent='manage_subscription_clicked'
              analyticsProperties={{ button_location: 'user_profile_settings' }}
              variant="outline"
              size="sm"
              onClick={handleManageSubscription}
            >
              Manage Billing
            </AnalyticsButton>
          )}
          <AnalyticsButton
            analyticsEvent='user_profile_settings_logout_clicked'
            variant="outline"
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
             Logout
          </AnalyticsButton>
        </div>
      </div>
    </div>
  )
} 
