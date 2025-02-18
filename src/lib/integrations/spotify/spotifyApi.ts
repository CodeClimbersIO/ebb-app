import { SpotifyAuthService } from './spotifyAuth'

interface SpotifyUserProfile {
  email: string
  display_name: string | null
  id: string
  product: string
}

interface SpotifyPlaylist {
  id: string
  name: string
}

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

export interface PlaybackState {
  track_window: {
    current_track: {
      name: string;
      artists: Array<{ name: string }>;
    };
  };
  paused: boolean;
  duration: number;
  position: number;
}

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
      console.error(`Error fetching ${path}:`, error)
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
      console.error('Error fetching user profile:', error)
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
      console.error('Error fetching playlists:', error)
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
      name: 'Ebb Flow Player',
      getOAuthToken: cb => cb(accessToken),
      volume: 0.5
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
        // Remove shuffle from here, as it's handled by the API call above.
      }),
    })
  }

  static async stopPlayback(deviceId: string): Promise<void> {
    try {
      await this.spotifyApiRequest(`me/player/pause?device_id=${deviceId}`, {
        method: 'PUT',
      })
    } catch (error) {
      console.error('Error stopping playback:', error)
    }
  }

  static async controlPlayback(action: 'play' | 'pause' | 'next' | 'previous', deviceId: string): Promise<void> {
    try {
      if (action === 'play') {
        await this.spotifyApiRequest(`me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
        })
      } else if (action === 'pause') {
        await this.stopPlayback(deviceId)
      } else {
        await this.spotifyApiRequest(`me/player/${action}?device_id=${deviceId}`, {
          method: 'POST',
        })
      }
    } catch (error) {
      console.error(`Error controlling playback (${action}):`, error)
    }
  }
} 
