import { useState, useEffect } from 'react'
import { Music, Check, ChevronsUpDown, AlertCircle } from 'lucide-react'
import { SpotifyIcon } from './icons/SpotifyIcon'
import { AppleMusicIcon } from './icons/AppleMusicIcon'
import { SpotifyAuthService } from '@/lib/integrations/spotify/spotifyAuth'
import { SpotifyApiService } from '@/lib/integrations/spotify/spotifyApi'
import { invoke } from '@tauri-apps/api/core'
import { useSpotifyInstallation } from '@/hooks/useSpotifyInstallation'
import { Button } from './ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Skeleton } from './ui/skeleton'
import { Alert, AlertDescription } from './ui/alert'
import { error as logError } from '@tauri-apps/plugin-log'

interface MusicSelectorProps {
  selectedPlaylist: string | null
  onPlaylistSelect: (playlist: { id: string, service: 'spotify' | 'apple' | null }) => void
}

export function MusicSelector({ selectedPlaylist, onPlaylistSelect }: MusicSelectorProps) {
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { isSpotifyInstalled } = useSpotifyInstallation()
  const [musicService, setMusicService] = useState<{
    type: 'spotify' | 'apple' | null
    connected: boolean
    playlists: { id: string; name: string }[]
  }>({
    type: null,
    connected: false,
    playlists: []
  })
  const [spotifyProfile, setSpotifyProfile] = useState<{ email: string; display_name: string | null; product: string } | null>(null)
  const [playlistData, setPlaylistData] = useState<{
    playlists: { id: string; name: string }[]
    images: Record<string, string>
  }>(() => {
    const saved = localStorage.getItem('playlistData')
    return saved ? JSON.parse(saved) : { playlists: [], images: {} }
  })

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
          // Clear URL parameters and redirect to start-flow
          if (window.location.pathname !== '/start-flow') {
            window.location.href = '/start-flow'
            return
          }
          window.history.replaceState({}, '', '/start-flow')
          // Check connection status after handling callback
          await checkSpotifyConnection()
          return
        }

        // Always check connection status after handling callback or on initial load
        await checkSpotifyConnection()
      } catch (error) {
        logError(`Error handling Spotify callback: ${error}`)
        setIsLoading(false)
      }
    }

    handleSpotifyCallback()
  }, [])

  const checkSpotifyConnection = async () => {
    try {
      const isConnected = await SpotifyAuthService.isConnected()

      if (isConnected) {
        const [profile, playlists] = await Promise.all([
          SpotifyApiService.getUserProfile(),
          SpotifyApiService.getUserPlaylists()
        ])

        if (profile) {
          setSpotifyProfile(profile)
          setMusicService({
            type: 'spotify',
            connected: true,
            playlists: playlists
          })
        }
      }
    } catch (error) {
      logError(`Error checking Spotify connection: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const loadPlaylistData = async () => {
      if (!musicService.connected || musicService.type !== 'spotify') return

      try {
        const playlists = await SpotifyApiService.getUserPlaylists()
        const images: Record<string, string> = {}

        for (const playlist of playlists) {
          const imageUrl = await SpotifyApiService.getPlaylistCoverImage(playlist.id)
          if (imageUrl) {
            images[playlist.id] = imageUrl
          }
        }

        const newPlaylistData = { playlists, images }
        setPlaylistData(newPlaylistData)
        localStorage.setItem('playlistData', JSON.stringify(newPlaylistData))
      } catch (error) {
        logError(`Error loading playlist data: ${error}`)
      }
    }

    loadPlaylistData()
  }, [musicService.connected, musicService.type])

  const handleSpotifyConnect = async () => {
    try {
      await SpotifyAuthService.connect()
    } catch (error) {
      logError(`Error connecting to Spotify: ${error}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 w-0 min-w-0">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
                onClick={() => {
                  if (!musicService.connected) {
                    setShowConnectDialog(true)
                  }
                }}
              >
                {selectedPlaylist ? (
                  <div className="flex items-center w-full max-w-[calc(100%-24px)] overflow-hidden">
                    {playlistData.images[selectedPlaylist] ? (
                      <img
                        src={playlistData.images[selectedPlaylist]}
                        alt=""
                        className="h-6 w-6 rounded mr-2 flex-shrink-0 object-cover"
                      />
                    ) : (
                      <Music className="h-4 w-4 mr-2 flex-shrink-0" />
                    )}
                    <span className="truncate">
                      {playlistData.playlists.find(p => p.id === selectedPlaylist)?.name || 'Select a playlist'}
                    </span>
                  </div>
                ) : (
                  musicService.connected ? 'Select a playlist' : 'Connect music'
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            {musicService.connected && spotifyProfile?.product === 'premium' && (
              <PopoverContent 
                side="bottom" 
                align="start" 
                sideOffset={4} 
                className="w-[--radix-popover-trigger-width] p-0 data-[side=bottom]:slide-in-from-top-2 animate-none max-w-full"
              >
                <Command>
                  <CommandInput placeholder="Search playlists..." />
                  <CommandList className="max-h-[210px]">
                    <CommandEmpty>No playlists found</CommandEmpty>
                    <CommandGroup>
                      {playlistData.playlists.map(playlist => (
                        <CommandItem
                          key={playlist.id}
                          value={playlist.name}
                          onSelect={() => {
                            onPlaylistSelect({ id: playlist.id, service: musicService.type })
                            setOpen(false)
                          }}
                        >
                          <div className="flex items-center w-full max-w-full overflow-hidden">
                            {playlistData.images[playlist.id] ? (
                              <img
                                src={playlistData.images[playlist.id]}
                                alt={playlist.name}
                                className="h-6 w-6 rounded mr-2 flex-shrink-0 object-cover"
                              />
                            ) : (
                              <Music className="h-4 w-4 mr-2 flex-shrink-0" />
                            )}
                            <span className="truncate">{playlist.name}</span>
                            <Check
                              className={`ml-auto h-4 w-4 flex-shrink-0 ${
                                selectedPlaylist === playlist.id ? 'opacity-100' : 'opacity-0'
                              }`}
                            />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            )}
          </Popover>
        </div>
        <div className="flex items-center">
          {isLoading ? (
            <Skeleton className="h-9 w-9 rounded" />
          ) : (
            <div 
              onClick={async (e) => {
                e.preventDefault()
                if (musicService.connected) {
                  if (isSpotifyInstalled) {
                    try {
                      const spotifyUri = selectedPlaylist
                        ? `spotify:playlist:${selectedPlaylist}`
                        : 'spotify:'
                      await invoke('plugin:shell|open', { path: spotifyUri })
                    } catch (error) {
                      logError(`Failed to open Spotify: ${error}`)
                      // Fallback to web version if native app fails to open
                      const webUrl = selectedPlaylist
                        ? `https://open.spotify.com/playlist/${selectedPlaylist}`
                        : 'https://open.spotify.com'
                      await invoke('plugin:shell|open', { path: webUrl })
                    }
                  } else {
                    await invoke('plugin:shell|open', { path: 'https://open.spotify.com/download' })
                  }
                } else {
                  setShowConnectDialog(true)
                }
              }}
              className="h-9 w-9 rounded-md flex items-center justify-center hover:bg-accent cursor-pointer"
            >
              {musicService.connected ? (
                <div className="h-6 w-6">
                  {musicService.type === 'spotify' ? <SpotifyIcon /> : <AppleMusicIcon />}
                </div>
              ) : (
                <Music className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-normal mb-4">Connect your music</DialogTitle>
          </DialogHeader>
          <Alert className="mb-4 border-yellow-500 text-yellow-600">
            <AlertCircle className="h-4 w-4 !text-yellow-600" />
            <AlertDescription>
              The Spotify integration is still in beta and only works for permitted users. If you would like to try it, please email nathan@ebb.cool
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => {
                setShowConnectDialog(false)
                handleSpotifyConnect()
              }}
              className="flex items-center justify-center gap-2 p-4 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
            >
              <SpotifyIcon />
              <span>Connect Spotify</span>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center gap-2 p-4 rounded-lg border opacity-50 cursor-not-allowed">
                    <AppleMusicIcon />
                    <span>Coming Soon</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Apple Music integration coming soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
