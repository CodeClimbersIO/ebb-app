import { useState, useEffect } from 'react'

interface Settings {
  showZeroState: boolean
}

const defaultSettings: Settings = {
  showZeroState: false
}

export function useSettings() {
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
