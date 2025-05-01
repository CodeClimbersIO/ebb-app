import { useEffect, useState } from 'react'
import { SpotifyApiService } from '@/lib/integrations/spotify/spotifyApi'
import { SpotifyAuthService } from '@/lib/integrations/spotify/spotifyAuth'
import { invoke } from '@tauri-apps/api/core'
import { useSpotifyInstallation } from '@/hooks/useSpotifyInstallation'
import { logAndToastError } from '@/lib/utils/logAndToastError'
import { SpotifyIcon } from './icons/SpotifyIcon'
import { Music } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

interface MusicPlayerProps {
  initialPlaylistId?: string
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ initialPlaylistId }) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(() => {
    return initialPlaylistId || localStorage.getItem('lastPlaylist') || ''
  })
  const [isSpotifyAuthenticated, setIsSpotifyAuthenticated] = useState(false)
  const [playlistData, setPlaylistData] = useState<{
    playlists: { id: string; name: string }[]
    images: Record<string, string>
  }>(() => {
    const saved = localStorage.getItem('playlistData')
    return saved ? JSON.parse(saved) : { playlists: [], images: {} }
  })
  const { isSpotifyInstalled } = useSpotifyInstallation()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await SpotifyAuthService.isConnected()
        setIsSpotifyAuthenticated(isAuthenticated)
      } catch (error) {
        logAndToastError('Error checking Spotify connection', error)
        setIsSpotifyAuthenticated(false)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    const startPlaybackIfNeeded = async () => {
      if (isSpotifyAuthenticated && selectedPlaylistId) {
        try {
          await SpotifyApiService.startPlayback(selectedPlaylistId)
        } catch (error) {
          logAndToastError(`Error starting playback for ${selectedPlaylistId}`, error)
        }
      }
    }
    startPlaybackIfNeeded()

    return () => {
      const pausePlayback = async () => {
        if (isSpotifyAuthenticated) {
          try {
            await SpotifyApiService.pausePlayback()
          } catch (error) {
            console.error('Error pausing playback on cleanup:', error)
          }
        }
      }
      pausePlayback()
    }
  }, [isSpotifyAuthenticated, selectedPlaylistId]) 

  useEffect(() => {
    const loadPlaylistData = async () => {
      if (!isSpotifyAuthenticated) return

      const cached = localStorage.getItem('playlistData')
      if (cached) {
        const parsedData = JSON.parse(cached)
        setPlaylistData(parsedData)
      }

      try {
        const playlists = await SpotifyApiService.getUserPlaylists()
        if (playlists.length === 0 && cached) {
          return
        }
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
        logAndToastError(`Error loading playlist data: ${error}`)
      }
    }

    loadPlaylistData()
  }, [isSpotifyAuthenticated])

  useEffect(() => {
    if (!isSpotifyAuthenticated) return

    const intervalId = setInterval(async () => {
      try {
        await SpotifyAuthService.refreshAccessToken()
      } catch (error) { 
        console.error('Background token refresh failed:', error)
      }
    }, 30 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [isSpotifyAuthenticated])

  const handlePlaylistChange = (playlistId: string) => {
    setSelectedPlaylistId(playlistId)
    localStorage.setItem('lastPlaylist', playlistId)
  }

  if (!isSpotifyAuthenticated) {
    return null 
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-8 bg-background z-50 flex justify-center">
      <Card className="p-4 w-auto max-w-lg">
        <CardContent className="p-0">
          <div className="flex items-center gap-8">
            <div className="flex items-center space-x-2">
              <SpotifyIcon />
              <a
                href="#"
                onClick={async (e) => {
                  e.preventDefault()
                  if (isSpotifyInstalled) {
                    try {
                      const spotifyUri = selectedPlaylistId
                        ? `spotify:playlist:${selectedPlaylistId}`
                        : 'spotify:'
                      await invoke('plugin:shell|open', { path: spotifyUri })
                    } catch (error) {
                      logAndToastError(`Failed to open Spotify app: ${error}`)
                      const webUrl = selectedPlaylistId
                        ? `https://open.spotify.com/playlist/${selectedPlaylistId}`
                        : 'https://open.spotify.com'
                      await invoke('plugin:shell|open', { path: webUrl })
                    }
                  } else {
                    await invoke('plugin:shell|open', { path: 'https://open.spotify.com/download' })
                  }
                }}
                className="text-sm text-muted-foreground hover:underline cursor-pointer"
              >
                {isSpotifyInstalled ? 'Open Spotify' : 'Get Spotify Free'}
              </a>
            </div>
            <Select value={selectedPlaylistId} onValueChange={handlePlaylistChange} disabled={playlistData.playlists.length === 0}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select playlist" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {playlistData.playlists.length > 0 ? (
                  playlistData.playlists.map(playlist => (
                    <SelectItem key={playlist.id} value={playlist.id}>
                      <div className="flex items-center overflow-hidden">
                        {playlistData.images[playlist.id] ? (
                          <img
                            src={playlistData.images[playlist.id]}
                            alt={playlist.name}
                            className="h-6 w-6 rounded mr-2 object-cover flex-shrink-0"
                          />
                        ) : (
                          <Music className="h-4 w-4 mr-2 flex-shrink-0" />
                        )}
                        <span className="truncate">{playlist.name}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="text-center text-sm text-muted-foreground p-4">No playlists found</div>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
