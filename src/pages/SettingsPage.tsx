import { Layout } from '@/components/Layout'
import { ModeToggle } from '@/components/ModeToggle'
import { Switch } from '@/components/ui/switch'
import { useSettings } from '../hooks/useSettings'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { SpotifyIcon } from '@/components/icons/SpotifyIcon'
import { AppleMusicIcon } from '@/components/icons/AppleMusicIcon'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useNavigate } from 'react-router-dom'
import { SpotifyApiService } from '@/lib/integrations/spotify/spotifyApi'
import { SpotifyAuthService } from '@/lib/integrations/spotify/spotifyAuth'

export const SettingsPage = () => {
  const { showZeroState, toggleZeroState } = useSettings()
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false)
  const [activeService, setActiveService] = useState<'spotify' | 'apple' | null>(null)
  const [serviceToUnlink, setServiceToUnlink] = useState<'spotify' | 'apple' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [spotifyProfile, setSpotifyProfile] = useState<{
    email: string;
    display_name: string | null;
    product?: string;
  } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
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

    checkSpotifyConnection()
  }, [])

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
    navigate('/start-flow?expandMusic=true')
  }

  return (
    <Layout>
      <TooltipProvider>
        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-semibold mb-8">Settings</h1>

            <div className="space-y-8">
              <div className="border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Appearance</h2>
                <div className="flex items-center justify-between">
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
              </div>

              <div className="border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Developer Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Show Zero State</div>
                      <div className="text-sm text-muted-foreground">
                        Toggle zero state UI for testing
                      </div>
                    </div>
                    <Switch
                      checked={showZeroState}
                      onCheckedChange={toggleZeroState}
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Integrations</h2>
                <div className="space-y-4">
                  {spotifyProfile && spotifyProfile.product !== 'premium' && (
                    <Alert variant="destructive" className="bg-red-950 border-red-900">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertTitle className="text-red-400">Error</AlertTitle>
                      <AlertDescription className="text-red-400">
                        Spotify Premium is required to use this integration
                      </AlertDescription>
                    </Alert>
                  )}
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
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnlink('spotify')}
                        >
                          Unlink
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
                                <ArrowRight className="w-4 h-4 ml-2" />
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
                        <Button variant="ghost" size="sm" onClick={() => handleUnlink('apple')}>
                          Unlink
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
            </div>

            <div className="mt-12 flex justify-between text-sm text-muted-foreground/50">
              <div>Ebb Version 1.0.0</div>
              <div>Slop by Paul Hovley and Nathan Covey</div>
            </div>
          </div>
        </div>

        <Dialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unlink {serviceToUnlink === 'spotify' ? 'Spotify' : 'Apple Music'}?</DialogTitle>
              <DialogDescription>
                This will remove access to your {serviceToUnlink === 'spotify' ? 'Spotify' : 'Apple Music'} account.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUnlinkDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmUnlink}>Unlink</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </Layout>
  )
} 
