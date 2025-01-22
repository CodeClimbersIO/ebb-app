import { useState, useEffect } from 'react'

interface Settings {
  showZeroState: boolean
  toggleZeroState: () => void
}

const defaultSettings: Settings = {
  showZeroState: false,
  toggleZeroState: () => {}
}

export const useSettings = () => {
  const [showZeroState, setShowZeroState] = useState<boolean>(() => {
    const saved = localStorage.getItem('showZeroState')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('showZeroState', JSON.stringify(showZeroState))
  }, [showZeroState])

  return {
    showZeroState,
    toggleZeroState: () => setShowZeroState(!showZeroState)
  }
}

export function useSettingsOld() {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('app-settings')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return defaultSettings
      }
    }
    return defaultSettings
  })

  useEffect(() => {
    localStorage.setItem('app-settings', JSON.stringify(settings))
  }, [settings])

  const toggleZeroState = () => {
    setSettings(prev => ({
      ...prev,
      showZeroState: !prev.showZeroState
    }))
  }

  return {
    showZeroState: settings.showZeroState,
    toggleZeroState
  }
} 
