import { SpotifyAuthService } from './spotifyAuth'
import { error as logError } from '@tauri-apps/plugin-log'
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

// Export the PlaybackState type from the Spotify namespace for use in other files
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
    // Load Spotify Web Playback SDK
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
          // Get a fresh token each time this callback is invoked
          const token = await SpotifyAuthService.getAccessToken()
          cb(token)
        } catch (error) {
          logError(`Error getting OAuth token for player: ${error}`)
          // Attempt to reconnect if possible
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

    // Add event listeners for player errors
    player.addListener('initialization_error', ({ message }) => {
      logError(`Failed to initialize player: ${message}`)
    })
    
    player.addListener('authentication_error', async ({ message }) => {
      logError(`Authentication error: ${message}`)
      // Try to refresh the token immediately
      try {
        await SpotifyAuthService.refreshAccessToken()
        // Reconnect the player after token refresh
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
      // Return the URL of the first image (usually the highest quality one)
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
          play: false // Don't auto-resume playback after transfer
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
