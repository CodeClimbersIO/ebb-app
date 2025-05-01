import { SpotifyAuthService } from './spotifyAuth'
import { logAndToastError } from '@/lib/utils/logAndToastError'
import { invoke } from '@tauri-apps/api/core'

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
  id: string | null;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
}

interface SpotifyPlaybackState {
  device: SpotifyDevice
  is_playing: boolean
}

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

export class SpotifyApiService {

  private static spotifyApiRequest = async (path: string, options: RequestInit = {}, ignoreNotFound: boolean = false) => {
    const accessToken = await SpotifyAuthService.getAccessToken()
    if (!accessToken) {
      throw new Error('Spotify access token not available')
    }
    try {
      const response = await fetch(`${SPOTIFY_API_BASE}/${path}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        ...options
      })

      if (response.status === 204) {
        return null // Indicate success with no content
      }

      if (response.status === 404 && ignoreNotFound) {
        return null // Indicate no active player found
      }

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Failed to fetch ${path}. Status: ${response.status}. Body: ${errorBody}`)
      }
      const contentType = response.headers.get('Content-Type') || ''
      if (contentType.includes('application/json')) {
        return await response.json()
      } else {
        return await response.text()
      }
    } catch (error) {
      console.error(`Error during Spotify API request to ${path}:`, error)
      throw error
    }
  }

  private static async getPlaybackDeviceId(): Promise<string | null> {
    try {
      const devices = await this.getAvailableDevices()
      if (!devices || devices.length === 0) return null

      const activeDevice = devices.find(d => d.is_active)
      if (activeDevice?.id) return activeDevice.id

      const computerDevice = devices.find(d => d.type.toLowerCase() === 'computer' && !d.is_restricted)
      if (computerDevice?.id) return computerDevice.id

      // Fallback to the first available device if no active or computer found
      return devices[0]?.id || null
    } catch (error) {
      logAndToastError(`Error getting playback device ID: ${error}`)
      return null
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
      logAndToastError(`Error fetching user profile: ${error}`)
      return null
    }
  }

  static async getUserPlaylists(): Promise<{ id: string, name: string }[]> {
    try {
      const isConnected = await SpotifyAuthService.isConnected()
      if (!isConnected) {
        return []
      }
      const data = await this.spotifyApiRequest('me/playlists?limit=50')

      return data.items.map((playlist: SpotifyPlaylist) => ({
        id: playlist.id,
        name: playlist.name
      }))
    } catch (error) {
      logAndToastError(`Error fetching playlists: ${error}`)
      return []
    }
  }

  static async getPlaybackState(): Promise<SpotifyPlaybackState | null> {
    try {
      const state = await this.spotifyApiRequest('me/player', { method: 'GET' }, true)
      return state
    } catch (error) {
      console.error(`Error fetching playback state: ${error}`)
      return null
    }
  }

  static async startPlayback(playlistId: string): Promise<void> {
    const deviceId = await this.getPlaybackDeviceId()
    if (!deviceId) {
      logAndToastError('No active Spotify device found. Opening Spotify...')
      try {
        await invoke('plugin:shell|open', { path: 'spotify:' })
      } catch (error) {
        console.warn('Failed to open Spotify app via URI, trying web URL:', error)
        try {
          await invoke('plugin:shell|open', { path: 'https://open.spotify.com' })
        } catch (webError) {
          logAndToastError('Failed to open Spotify app or web version.', webError)
        }
      }
      return
    }

    try {
      try {
        await this.spotifyApiRequest(`me/player/shuffle?state=true&device_id=${deviceId}`, {
          method: 'PUT',
        })
      } catch (shuffleError) {
        console.warn(`Could not enable shuffle: ${shuffleError}`)
      }

      await this.spotifyApiRequest(`me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          context_uri: `spotify:playlist:${playlistId}`,
        }),
      })
    } catch (error) {
      logAndToastError(`Error starting playback: ${error}`)
    }
  }

  static async pausePlayback(): Promise<void> {
    const deviceId = await this.getPlaybackDeviceId()
    if (!deviceId) return

    try {
      await this.spotifyApiRequest(`me/player/pause?device_id=${deviceId}`, {
        method: 'PUT',
      })
    } catch (error) {
      console.error(`Error pausing playback: ${error}`)
    }
  }

  static async resumePlayback(): Promise<void> {
    const deviceId = await this.getPlaybackDeviceId()
    if (!deviceId) {
      logAndToastError('No active Spotify device found to resume.')
      return
    }
    try {
      await this.spotifyApiRequest(`me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
      })
    } catch (error) {
      logAndToastError(`Error resuming playback: ${error}`)
    }
  }

  static async nextTrack(): Promise<void> {
    const deviceId = await this.getPlaybackDeviceId()
    if (!deviceId) return

    try {
      await this.spotifyApiRequest(`me/player/next?device_id=${deviceId}`, {
        method: 'POST',
      })
    } catch (error) {
      console.error(`Error skipping to next track: ${error}`)
    }
  }

  static async previousTrack(): Promise<void> {
    const deviceId = await this.getPlaybackDeviceId()
    if (!deviceId) return

    try {
      await this.spotifyApiRequest(`me/player/previous?device_id=${deviceId}`, {
        method: 'POST',
      })
    } catch (error) {
      console.error(`Error skipping to previous track: ${error}`)
    }
  }


  static async getPlaylistCoverImage(playlistId: string): Promise<string | null> {
    try {
      // Added connection check
      const isConnected = await SpotifyAuthService.isConnected()
      if (!isConnected) return null

      const data = await this.spotifyApiRequest(`playlists/${playlistId}/images`)
      // Check if images array exists and has items before accessing index 0
      return data?.[0]?.url || null
    } catch (error) {
      logAndToastError(`Error fetching playlist cover image: ${error}`)
      return null
    }
  }

  static async getAvailableDevices(): Promise<SpotifyDevice[]> {
    try {
      const isConnected = await SpotifyAuthService.isConnected()
      if (!isConnected) return []

      const response = await this.spotifyApiRequest('me/player/devices')
      return response?.devices || []
    } catch (error) {
      logAndToastError(`Error fetching available devices: ${error}`)
      return []
    }
  }

} 
