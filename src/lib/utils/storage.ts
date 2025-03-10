// Keys used in localStorage
const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'onboarding_completed',
  LAST_DURATION: 'lastDuration',
  LAST_PLAYLIST: 'lastPlaylist',
  PLAYLIST_DATA: 'playlistData',
  SELECTED_BLOCKS: 'selectedBlocks',
  SPOTIFY_ACCESS_TOKEN: 'spotify_access_token',
  SPOTIFY_REFRESH_TOKEN: 'spotify_refresh_token',
  SPOTIFY_EXPIRES_AT: 'spotify_expires_at',
  SPOTIFY_CODE_VERIFIER: 'spotify_code_verifier',
  THEME: 'vite-ui-theme'
}

export const StorageUtils = {
  clearAllAppData: (): void => {
    // Clear all app-related localStorage items
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  },
  
  // You can add more specific methods here as needed
  clearOnboardingData: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED)
  },
  
  clearSpotifyData: (): void => {
    localStorage.removeItem(STORAGE_KEYS.SPOTIFY_ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.SPOTIFY_REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.SPOTIFY_EXPIRES_AT)
    localStorage.removeItem(STORAGE_KEYS.SPOTIFY_CODE_VERIFIER)
  }
} 
