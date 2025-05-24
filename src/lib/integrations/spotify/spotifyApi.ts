import { invoke } from '@tauri-apps/api/core'
import { SpotifyAuthService } from './spotifyAuth'
import { error as logError } from '@tauri-apps/plugin-log'
import { logAndToastError } from '../../utils/ebbError.util'
interface SpotifyUserProfile {
  email: string
  display_name: string | null
  id: string
  product: string
}

interface SpotifyPlaylist {
  id: string
  name: string
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
}

interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
}

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

export type PlaybackState = Spotify.PlaybackState;

export class SpotifyApiService {

  private static spotifyApiRequest = async (path: string, options: RequestInit = {})=>{
    const accessToken = await SpotifyAuthService.getAccessToken()
    try {
      const response = await fetch(`${SPOTIFY_API_BASE}/${path}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        ...options
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch ${path}`)
      }
      const contentType = response.headers.get('Content-Type') || ''
      if (contentType.includes('application/json')) {
        return await response.json()
      } else {
        return await response.text()
      }
    } catch (error) {
      logError(`Error fetching ${path}: ${error}`)
      throw error
    }
  }


  static async getUserProfile(): Promise<SpotifyUserProfile | null> {
    const isConnected = await SpotifyAuthService.isConnected()
    if (!isConnected) {
      return null
    }

    try {
      const data = await this.spotifyApiRequest('me')
      return {
        email: data.email,
        display_name: data.display_name,
        id: data.id,
        product: data.product
      }
    } catch (error) {
      logError(`Error fetching user profile: ${error}`)
      return null
    }
  }

  static async getUserPlaylists(): Promise<{ id: string, name: string }[]> {
    try {
      const data = await this.spotifyApiRequest('me/playlists?limit=50')
      
      return data.items.map((playlist: SpotifyPlaylist) => ({
        id: playlist.id,
        name: playlist.name
      }))
    } catch (error) {
      logError(`Error fetching playlists: ${error}`)
      return []
    }
  }

  static async initializePlayer(): Promise<void> {
    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    document.body.appendChild(script)

    return new Promise((resolve) => {
      window.onSpotifyWebPlaybackSDKReady = () => {
        resolve()
      }
    })
  }

  static async createPlayer(): Promise<Spotify.Player> {
    const accessToken = await SpotifyAuthService.getAccessToken()
    if (!accessToken) throw new Error('Not connected to Spotify')
    
    const player = new window.Spotify.Player({
      name: 'Ebb Player',
      getOAuthToken: async (cb) => {
        try {
          const token = await SpotifyAuthService.getAccessToken()
          cb(token)
        } catch (error) {
          logError(`Error getting OAuth token for player: ${error}`)
          const isConnected = await SpotifyAuthService.isConnected()
          if (isConnected) {
            const token = await SpotifyAuthService.getAccessToken()
            cb(token)
          } else {
            logError('Spotify connection lost, unable to refresh token')
          }
        }
      },
      volume: 0.5
    })

    player.addListener('initialization_error', ({ message }) => {
      logError(`Failed to initialize player: ${message}`)
    })
    
    player.addListener('authentication_error', async ({ message }) => {
      logError(`Authentication error: ${message}`)
      try {
        await SpotifyAuthService.refreshAccessToken()
        player.connect()
      } catch (refreshError) {
        logError(`Failed to refresh token after authentication error: ${refreshError}`)
      }
    })
    
    player.addListener('account_error', ({ message }) => {
      logError(`Account error: ${message}`)
    })
    
    player.addListener('playback_error', ({ message }) => {
      logError(`Playback error: ${message}`)
    })

    await player.connect()
    return player
  }

  static async startPlayback(playlistId: string, deviceId: string): Promise<void> {
    // Enable shuffle.
    await this.spotifyApiRequest(`me/player/shuffle?device_id=${deviceId}&state=true`, {
      method: 'PUT',
    })
    
    await this.spotifyApiRequest(`me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify({
        context_uri: `spotify:playlist:${playlistId}`,
      }),
    })
  }

  static async stopPlayback(deviceId: string): Promise<void> {
    try {
      await this.spotifyApiRequest(`me/player/pause?device_id=${deviceId}`, {
        method: 'PUT',
      })
    } catch (error) {
      logError(`Error stopping playback: ${error}`)
    }
  }

  static async getPlaylistCoverImage(playlistId: string): Promise<string | null> {
    try {
      const images = await this.spotifyApiRequest(`playlists/${playlistId}/images`)
      return images[0]?.url || null
    } catch (error) {
      logError(`Error fetching playlist cover image: ${error}`)
      return null
    }
  }

  static async getAvailableDevices(): Promise<SpotifyDevice[]> {
    try {
      const response = await this.spotifyApiRequest('me/player/devices')
      return response.devices
    } catch (error) {
      logError(`Error fetching available devices: ${error}`)
      return []
    }
  }

  static async transferPlaybackToDevice(deviceId: string): Promise<void> {
    try {
      await this.spotifyApiRequest('me/player', {
        method: 'PUT',
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false
        })
      })
    } catch (error) {
      logError(`Error transferring playback: ${error}`)
    }
  }

  static async transferPlaybackToComputerDevice(): Promise<void> {
    try {
      const devices = await this.getAvailableDevices()
      const computerDevice = devices.find(device => 
        device.type.toLowerCase() === 'computer' && !device.is_restricted
      )
      
      if (computerDevice) {
        await this.transferPlaybackToDevice(computerDevice.id)
      }
    } catch (error) {
      logError(`Error transferring playback to computer: ${error}`)
    }
  }

} 

export const openSpotifyLink = async (isSpotifyInstalled: boolean, type: 'playlist' | 'artist' | 'album' | 'track', id: string) => {
  if (isSpotifyInstalled) {
    try {
      const spotifyUri = id
        ? `spotify:${type}:${id}`
        : 'spotify:'
      await invoke('plugin:shell|open', { path: spotifyUri })
    } catch (error) {
      logAndToastError(`Failed to open Spotify: ${error}`, error)
      // Fallback to web version if native app fails to open
      const webUrl = id
        ? `https://open.spotify.com/${type}/${id}`
        : 'https://open.spotify.com'
      await invoke('plugin:shell|open', { path: webUrl })
    }
  } else {
    await invoke('plugin:shell|open', { path: 'https://open.spotify.com/download' })
  }
}

// spotify:artist:57DlMWmbVIf2ssJ8QBpBa will return 57DlMWmbVIf2ssJ8QBpBa
export const getSpotifyIdFromUri = (uri: string) => {
  const parts = uri.split(':')
  return parts[parts.length - 1]
}
