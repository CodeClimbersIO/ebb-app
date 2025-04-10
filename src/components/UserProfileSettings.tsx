import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PaywallDialog } from '@/components/PaywallDialog'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { LogOut, KeyRound } from 'lucide-react'
import { format } from 'date-fns'
import { User } from '@supabase/supabase-js'
import { useLicenseStore } from '@/stores/licenseStore' // Import Zustand store
import supabase from '@/lib/integrations/supabase'
import { useNavigate } from 'react-router-dom'

const DEVICE_ID_KEY = 'ebb_device_id'

interface UserProfileSettingsProps {
  user: User | null
  // license and isLoadingLicense props are removed, fetched from store instead
}

export function UserProfileSettings({ user }: UserProfileSettingsProps) {
  const navigate = useNavigate()
  const license = useLicenseStore((state) => state.license)
  const isLoadingLicense = useLicenseStore((state) => state.isLoading)

  const hasProLicense = !isLoadingLicense && license && (license.status === 'active' || license.status === 'trialing')

  // Logout Handler (copied from SettingsPage)
  const handleLogout = async () => {
    const deviceId = localStorage.getItem(DEVICE_ID_KEY)
    const { data: { user: currentUser } } = await supabase.auth.getUser() // Renamed user to avoid conflict

    if (deviceId && currentUser) {
      try {
        const { error: deleteError } = await supabase
          .from('active_devices')
          .delete()
          .match({ user_id: currentUser.id, device_id: deviceId })

        if (deleteError) {
          console.error('[Logout] Failed to delete device registration:', deleteError)
        } else {
           console.log(`[Logout] Device registration ${deviceId} deleted.`)
        }
      } catch (err) {
         console.error('[Logout] Error during device deletion:', err)
      }
    } else {
       console.warn('[Logout] Could not find deviceId or user to delete device registration.')
    }

    console.log('[Logout] Signing out...')
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      console.error('[Logout] Error signing out:', signOutError)
    } else {
      console.log('[Logout] Sign out successful, navigating to /login')
      navigate('/login')
    }
  }

  // Manage Subscription Handler (copied from SettingsPage)
  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { return_url: window.location.href },
      })
      if (error) throw error
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Error creating portal session:', err)
    }
  }

  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-center justify-between">
        {/* Left Side: Avatar and Info Column */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>
                {(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -left-1 bg-background p-0.5 rounded-full">
              {isLoadingLicense ? (
                <KeyRound className="h-5 w-5 text-muted-foreground animate-pulse" />
              ) : hasProLicense ? (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <KeyRound className="h-5 w-5 text-yellow-500 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Status: {license?.status}</p>
                      {license?.license_type && <p>Type: {license.license_type}</p>}
                      {license?.expiration_date && <p>Updates until: {format(new Date(license.expiration_date), 'PP')}</p>}
                      {/* Manage Subscription button inside tooltip */}
                      {license?.license_type === 'subscription' && (
                          <Button size="sm" variant="outline" onClick={handleManageSubscription} className="mt-2 w-full">Manage Subscription</Button>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <PaywallDialog>
                  <KeyRound className="h-5 w-5 text-muted-foreground hover:text-yellow-500 cursor-pointer" />
                </PaywallDialog>
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
          </div>
        </div>

        {/* Right Side: Just Logout */}
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={handleLogout}>
             <LogOut className="h-4 w-4 mr-2" />
             Logout
           </Button>
        </div>
      </div>
    </div>
  )
} 
