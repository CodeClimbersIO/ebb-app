import { openUrl } from '@tauri-apps/plugin-opener'
import { SpotifyApiService } from './spotifyApi'

const SPOTIFY_CONFIG = {
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
  scopes: [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state',
  ].join(' '),
  redirectUri: import.meta.env.DEV 
    ? 'http://localhost:1420/settings?spotify=callback'
    : 'https://ebb.cool/spotify-success'
}

interface SpotifyTokens {
  access_token: string
  refresh_token: string
  expires_at: string
}

const STORAGE_KEY = 'spotify_tokens'

// Store state in localStorage to verify in callback
const STATE_KEY = 'spotify_auth_state'

export class SpotifyAuthService {
  private static getStoredTokens(): SpotifyTokens | null {
    const tokens = localStorage.getItem(STORAGE_KEY)
    return tokens ? JSON.parse(tokens) : null
  }

  private static setStoredTokens(tokens: SpotifyTokens): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
  }

  private static clearStoredTokens(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  static async connect(): Promise<void> {
    const state = crypto.randomUUID()
    localStorage.setItem('spotify_auth_state', state)
    
    const params = new URLSearchParams({
      client_id: SPOTIFY_CONFIG.clientId,
      response_type: 'code',
      redirect_uri: SPOTIFY_CONFIG.redirectUri,
      state: state,
      scope: SPOTIFY_CONFIG.scopes,
      show_dialog: 'true'
    })

    const url = `https://accounts.spotify.com/authorize?${params.toString()}`
    
    if (import.meta.env.DEV) {
      window.location.href = url
    } else {
      await openUrl(url)
    }
  }

  static async handleCallback(code: string, state: string | null): Promise<void> {
    try {
      
      // Verify state matches what we stored
      const storedState = localStorage.getItem(STATE_KEY)
      
      if (state === null || state !== storedState) {
        throw new Error('State mismatch')
      }
      
      // Clear stored state
      localStorage.removeItem(STATE_KEY)

      const tokens = await this.exchangeCodeForTokens(code)
      
      this.setStoredTokens({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      })

      // Verify connection by fetching profile
      const profile = await SpotifyApiService.getUserProfile()
      if (!profile) {
        throw new Error('Failed to verify connection')
      }
    } catch (error) {
      console.error('Error in handleCallback:', error)
      throw error
    }
  }

  static async disconnect(): Promise<void> {
    this.clearStoredTokens()
  }

  private static async exchangeCodeForTokens(code: string) {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CONFIG.clientId}:${SPOTIFY_CONFIG.clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: SPOTIFY_CONFIG.redirectUri,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to exchange code for tokens: ${errorText}`)
    }

    return response.json()
  }

  private static async refreshAccessToken(): Promise<SpotifyTokens | undefined> {
    const tokens = this.getStoredTokens()
    if (!tokens?.refresh_token) throw new Error('No refresh token available')

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${SPOTIFY_CONFIG.clientId}:${SPOTIFY_CONFIG.clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
      }),
    })

    if (!response.ok) {
      console.log('Failed to refresh token', response)
      throw new Error('Failed to refresh token')
    }

    const newTokens = await response.json()
    this.setStoredTokens({
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token ?? tokens.refresh_token,
      expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
    })
    return newTokens
  }

  static async getAuth(): Promise<SpotifyTokens | undefined> {
    const tokens = this.getStoredTokens()
    if (!tokens) return

    const expiresAt = new Date(tokens.expires_at)
    const now = new Date()
    
    if (expiresAt <= now) {
      // Try to refresh the token
      console.log('Refreshing token')
      return this.refreshAccessToken()
    }

    return tokens
  }

  static async isConnected(): Promise<boolean> {
    const tokens = await this.getAuth()
    console.log('Tokens', tokens)
    return Boolean(tokens)
  }

  static async getAccessToken(): Promise<string> {
    const tokens = await this.getAuth()
    if (!tokens) throw new Error('Not connected to Spotify')

    return tokens.access_token
  }
  
} 
