import { useEffect, useState } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SpotifyIcon } from '@/components/icons/SpotifyIcon'
import { Button } from '@/components/ui/button'
import { SpotifyAuthService } from '@/lib/integrations/spotify/spotifyAuth'
import { SpotifyApiService } from '@/lib/integrations/spotify/spotifyApi'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { SlackSettings } from './SlackSettings'

export const IntegrationSettings = () => {
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false)
  const [serviceToUnlink, setServiceToUnlink] = useState<'spotify' | 'apple' | null>(null)
  const [activeService, setActiveService] = useState<'spotify' | 'apple' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [spotifyProfile, setSpotifyProfile] = useState<{
    email: string;
    display_name: string | null;
    product?: string;
  } | null>(null)


  useEffect(() => {
    const initializeSettings = async () => {
      setIsLoading(true)
      try {
        const hashParams = window.location.hash.replace('#', '')
        const searchParams = new URLSearchParams(window.location.search || hashParams.substring(hashParams.indexOf('?')))
        const code = searchParams.get('code')
        const state = searchParams.get('state')

        if (code && state) {
          await SpotifyAuthService.handleCallback(code, state)
          window.history.replaceState({}, '', '/settings')
        }

        const isConnected = await SpotifyAuthService.isConnected()
        if (isConnected) {
          const profile = await SpotifyApiService.getUserProfile()
          if (profile) {
            setSpotifyProfile(profile)
            setActiveService('spotify')
          }
        }
      } catch (error) {
        logAndToastError(`Error handling Spotify callback: ${error}`, error)
        setIsLoading(false)
      }

      if (window.location.hash === '#music-integrations') {
        const section = document.getElementById('music-integrations')
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' })
        }
      }

      if (window.location.hash === '#slack-integrations') {
        const section = document.getElementById('slack-integrations')
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
    initializeSettings()
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
    try {
      await SpotifyAuthService.connect()
    } catch (error) {
      logAndToastError(`Error connecting to Spotify: ${error}`, error)
    }
  }

  return (
    <div id="music-integrations" className="border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Integrations</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Music</h3>
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

        </div>
        <SlackSettings />
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
    </div>
  )
}
