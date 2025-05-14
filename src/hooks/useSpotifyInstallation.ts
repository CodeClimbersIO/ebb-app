import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { logAndToastError } from '@/lib/utils/logAndToastError'

export const useSpotifyInstallation = () => {
  const [isSpotifyInstalled, setIsSpotifyInstalled] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkSpotifyInstallation = async () => {
      try {
        const installed = await invoke<boolean>('detect_spotify')
        setIsSpotifyInstalled(installed)
      } catch (error) {
        logAndToastError(`Error detecting Spotify: ${error}`, error)
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
