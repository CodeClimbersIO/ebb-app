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
import { useNavigate } from 'react-router-dom'

interface MusicSelectorProps {
  selectedPlaylist: string | null
  onPlaylistSelect: (playlist: { id: string, service: 'spotify' | 'apple' | null }) => void
  onConnectClick?: () => void
}

export function MusicSelector({ selectedPlaylist, onPlaylistSelect, onConnectClick }: MusicSelectorProps) {
  const navigate = useNavigate()
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

        setIsLoading(false)
      } catch (error) {
        console.error('Error checking Spotify connection:', error)
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
      {!musicService.connected ? (
        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={() => !isLoading && onConnectClick?.()}
            className={`flex items-center justify-center gap-2 p-4 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="scale-110">
                {musicService.type === 'spotify' ? <SpotifyIcon /> : <AppleMusicIcon />}
              </div>
              <div className="flex items-center gap-2">
                <span 
                  onClick={() => navigate('/settings#music-integrations')}
                  className="text-base text-muted-foreground hover:underline cursor-pointer"
                >
                  Connected
                </span>
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              </div>
            </div>

            {spotifyProfile?.product === 'premium' ? (
              <Select
                value={selectedPlaylist || ''}
                onValueChange={(value) => onPlaylistSelect({ id: value, service: musicService.type })}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a playlist" />
                </SelectTrigger>
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
              </Select>
            ) : (
              <div className="text-sm text-destructive">
                Error: Spotify Premium required
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
} 
