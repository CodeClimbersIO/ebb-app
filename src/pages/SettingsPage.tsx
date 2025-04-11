import { Layout } from '@/components/Layout'
import { ModeToggle } from '@/components/ModeToggle'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { SpotifyIcon } from '@/components/icons/SpotifyIcon'
import { AppleMusicIcon } from '@/components/icons/AppleMusicIcon'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { DiscordIcon } from '@/components/icons/DiscordIcon'
import { GithubIcon } from '@/components/icons/GithubIcon'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SpotifyApiService } from '@/lib/integrations/spotify/spotifyApi'
import { SpotifyAuthService } from '@/lib/integrations/spotify/spotifyAuth'
import supabase from '@/lib/integrations/supabase'
import { ResetAppData } from '@/components/developer/ResetAppData'
import { version } from '../../package.json'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { invoke } from '@tauri-apps/api/core'
import { ShortcutInput } from '@/components/ShortcutInput'
import { Switch } from '@/components/ui/switch'
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart'

export const SettingsPage = () => {
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false)
  const [activeService, setActiveService] = useState<'spotify' | 'apple' | null>(null)
  const [serviceToUnlink, setServiceToUnlink] = useState<'spotify' | 'apple' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autostartEnabled, setAutostartEnabled] = useState(false)
  const [spotifyProfile, setSpotifyProfile] = useState<{
    email: string;
    display_name: string | null;
    product?: string;
  } | null>(null)
  const navigate = useNavigate()
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const handleSpotifyCallback = async () => {
      try {
        const hashParams = window.location.hash.replace('#', '')
        const searchParams = new URLSearchParams(window.location.search || hashParams.substring(hashParams.indexOf('?')))
        const code = searchParams.get('code')
        const state = searchParams.get('state')

        if (code && state) {
          setIsLoading(true)
          await SpotifyAuthService.handleCallback(code, state)
          // Clear URL parameters
          window.history.replaceState({}, '', '/settings')
          // Force a full page refresh to get updated Spotify state
          window.location.reload()
          return
        }

        // Always check connection status after handling callback or on initial load
        await checkSpotifyConnection()
      } catch (error) {
        console.error('Error handling Spotify callback:', error)
        setIsLoading(false)
      }
    }

    handleSpotifyCallback()

    // Scroll to music integrations section if hash is present
    if (window.location.hash === '#music-integrations') {
      const section = document.getElementById('music-integrations')
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [])

  useEffect(() => {
    const checkAutostart = async () => {
      const enabled = await isEnabled()
      setAutostartEnabled(enabled)
    }
    checkAutostart()
  }, [])

  const checkSpotifyConnection = async () => {
    try {
      const isConnected = await SpotifyAuthService.isConnected()

      if (isConnected) {
        const profile = await SpotifyApiService.getUserProfile()
        if (profile) {
          setSpotifyProfile(profile)
          setActiveService('spotify')
        }
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Error checking Spotify connection:', error)
      setIsLoading(false)
    }
  }

  const handleUnlink = (service: 'spotify' | 'apple') => {
    setServiceToUnlink(service)
    setShowUnlinkDialog(true)
  }

  const confirmUnlink = async () => {
    if (serviceToUnlink === 'spotify') {
      await SpotifyAuthService.disconnect()
      setSpotifyProfile(null)
    }
    setActiveService(null)
    setShowUnlinkDialog(false)
    setServiceToUnlink(null)
  }

  const handleSpotifyConnect = async () => {
    try {
      await SpotifyAuthService.connect()
    } catch (error) {
      console.error('Error connecting to Spotify:', error)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session found')

      // Make API call to your backend endpoint to delete the user
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'x-client-info': 'codeclimbers'
          }
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete account')
      }

      // Sign out the user after successful deletion
      await supabase.auth.signOut()
      navigate('/')
    } catch (error) {
      console.error('Error deleting account:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteAccountDialog(false)
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    navigate('/login')
  }

  const handleAutostartToggle = async () => {
    try {
      if (autostartEnabled) {
        await disable()
      } else {
        await enable()
      }
      setAutostartEnabled(!autostartEnabled)
    } catch (error) {
      console.error('Error toggling autostart:', error)
    }
  }

  return (
    <Layout>
      <TooltipProvider>
        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-semibold mb-8">Settings</h1>

            <div className="space-y-8">
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-lg font-semibold">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                      </h2>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <GoogleIcon className="h-3.5 w-3.5" />
                        <span>{user?.email}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">System</h2>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="font-medium">Theme</div>
                    <div className="text-sm text-muted-foreground">
                      Customize how Ebb looks on your device
                    </div>
                  </div>
                  <div className="relative">
                    <ModeToggle />
                  </div>
                </div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="font-medium">Global Shortcut</div>
                    <div className="text-sm text-muted-foreground">
                      Use this shortcut anywhere to start a focus session
                    </div>
                  </div>
                  <ShortcutInput popoverAlign="end" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Launch on Startup</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically start Ebb when you log in to your computer
                    </div>
                  </div>
                  <Switch
                    checked={autostartEnabled}
                    onCheckedChange={handleAutostartToggle}
                  />
                </div>
              </div>

              <div id="music-integrations" className="border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Integrations</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <SpotifyIcon />
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">Spotify</div>
                          {spotifyProfile && (
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              <div className="text-sm text-muted-foreground">
                                {spotifyProfile.email}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      {activeService === 'spotify' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnlink('spotify')}
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={activeService === 'apple' || isLoading}
                                onClick={handleSpotifyConnect}
                              >
                                Connect
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {activeService === 'apple' && (
                            <TooltipContent>
                              <p>Only one music service can be connected at a time</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AppleMusicIcon />
                      <div className="flex items-center gap-2">
                        <div className="font-medium">Apple Music</div>
                        {activeService === 'apple' && (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span className="text-sm text-muted-foreground">Linked</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      {activeService === 'apple' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnlink('apple')}
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={true}
                              >
                                Coming Soon
                              </Button>
                            </span>
                          </TooltipTrigger>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Community</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-8">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Ebb is maintained by an open source community called CodeClimbers. Join us on Discord or GitHub to get involved.
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => invoke('plugin:shell|open', { path: 'https://discord.gg/qhST6C5XxV' })}
                        className="gap-2"
                      >
                        <DiscordIcon />
                        Discord
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => invoke('plugin:shell|open', { path: 'https://github.com/CodeClimbersIO/ebb-app' })}
                        className="gap-2"
                      >
                        <GithubIcon />
                        GitHub
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6 mt-8">
                <h2 className="text-lg font-semibold mb-4 text-red-500">Danger Zone</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-8">
                    <div>
                      <div className="font-medium">Delete Account</div>
                      <div className="text-sm text-muted-foreground">
                        Permanently delete your account and cloud data. Local usage data will not be deleted.
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteAccountDialog(true)}
                      >
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Developer section - only visible in development mode */}
            {import.meta.env.DEV && (
              <div className="mt-12 border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Developer Options</h2>
                <ResetAppData />
              </div>
            )}

            <div className="mt-12 flex justify-between text-sm text-muted-foreground/50">
              <div>Ebb Version {version}</div>
              <div className="flex items-center gap-2">
                <span>Slop by </span>
                <button 
                  onClick={() => invoke('plugin:shell|open', { path: 'https://x.com/PaulHovley' })}
                  className="hover:underline"
                >
                  Paul Hovley
                </button>
                <span>&</span>
                <button 
                  onClick={() => invoke('plugin:shell|open', { path: 'https://x.com/nathan_covey' })}
                  className="hover:underline"
                >
                  Nathan Covey
                </button>
                <span>•</span>
                <button 
                  onClick={() => invoke('plugin:shell|open', { path: 'https://ebb.cool/terms' })}
                  className="hover:underline"
                >
                  Terms
                </button>
                <span>•</span>
                <button 
                  onClick={() => invoke('plugin:shell|open', { path: 'https://ebb.cool/privacy' })}
                  className="hover:underline"
                >
                  Privacy
                </button>
              </div>
            </div>
          </div>
        </div>

        <Dialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disconnect {serviceToUnlink === 'spotify' ? 'Spotify' : 'Apple Music'}?</DialogTitle>
              <DialogDescription>
                This will remove access to your {serviceToUnlink === 'spotify' ? 'Spotify' : 'Apple Music'} account.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUnlinkDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmUnlink}>Disconnect</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove all of your scoring and friends data from our servers. Your local usage data
                will remain.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteAccountDialog(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </Layout>
  )
} 
