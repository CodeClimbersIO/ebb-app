import { useState, useEffect } from 'react'
import { Music } from 'lucide-react'
import { SpotifyIcon } from './icons/SpotifyIcon'
import { AppleMusicIcon } from './icons/AppleMusicIcon'
import { SpotifyAuthService } from '@/lib/integrations/spotify/spotifyAuth'
import { SpotifyApiService } from '@/lib/integrations/spotify/spotifyApi'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
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

interface MusicSelectorProps {
  selectedPlaylist: string | null
  onPlaylistSelect: (playlist: { id: string, service: 'spotify' | 'apple' | null }) => void
  onConnectClick?: () => void
}

export function MusicSelector({ selectedPlaylist, onPlaylistSelect, onConnectClick }: MusicSelectorProps) {
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
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
        console.error('Error checking Spotify connection:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSpotifyConnection()
  }, [])

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
        console.error('Error loading playlist data:', error)
      }
    }

    loadPlaylistData()
  }, [musicService.connected, musicService.type])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Select
            value={selectedPlaylist || ''}
            onValueChange={(value) => onPlaylistSelect({ id: value, service: musicService.type })}
            onOpenChange={() => {
              if (!musicService.connected) {
                setShowConnectDialog(true)
              }
            }}
          >
            <SelectTrigger 
              className="w-full"
              onClick={() => {
                if (!musicService.connected) {
                  setShowConnectDialog(true)
                }
              }}
            >
              <SelectValue placeholder={musicService.connected ? 'Select a playlist' : 'Connect music'} />
            </SelectTrigger>
            {musicService.connected && spotifyProfile?.product === 'premium' && (
              <SelectContent className="max-h-[250px]">
                {playlistData.playlists.map(playlist => (
                  <SelectItem key={playlist.id} value={playlist.id}>
                    <div className="flex items-center">
                      {playlistData.images[playlist.id] ? (
                        <img
                          src={playlistData.images[playlist.id]}
                          alt={playlist.name}
                          className="h-6 w-6 rounded mr-2 object-cover"
                        />
                      ) : (
                        <Music className="h-4 w-4 mr-2" />
                      )}
                      <span className="truncate">{playlist.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            )}
          </Select>
        </div>
        <div className="w-[24px] h-[24px]">
          {isLoading ? (
            <Skeleton className="w-full h-full rounded" />
          ) : musicService.connected ? (
            <div 
              onClick={onConnectClick}
              className="cursor-pointer hover:opacity-80 transition-opacity transform-gpu"
            >
              {musicService.type === 'spotify' ? <SpotifyIcon /> : <AppleMusicIcon />}
            </div>
          ) : (
            <div 
              onClick={() => setShowConnectDialog(true)}
              className="cursor-pointer hover:opacity-80 transition-opacity transform-gpu text-muted-foreground h-6 w-6 flex items-center justify-center"
            >
              <Music className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>

      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-normal mb-4">Connect your music</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => {
                setShowConnectDialog(false)
                onConnectClick?.()
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
