import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { error as logError } from '@tauri-apps/plugin-log'

export const useSpotifyInstallation = () => {
  const [isSpotifyInstalled, setIsSpotifyInstalled] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkSpotifyInstallation = async () => {
      try {
        const installed = await invoke<boolean>('detect_spotify')
        setIsSpotifyInstalled(installed)
      } catch (error) {
        logError(`Error detecting Spotify: ${error}`)
        setIsSpotifyInstalled(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkSpotifyInstallation()
  }, [])

  return {
    isSpotifyInstalled,
    isChecking
  }
} 
