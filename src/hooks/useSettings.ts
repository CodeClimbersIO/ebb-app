import { useState, useEffect } from 'react'

export const useSettings = () => {
  const [showZeroState, setShowZeroState] = useState(() => {
    const saved = localStorage.getItem('settings.showZeroState')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('settings.showZeroState', JSON.stringify(showZeroState))
  }, [showZeroState])

  const toggleZeroState = (): void => setShowZeroState((prev: boolean): boolean => !prev)

  return {
    showZeroState,
    toggleZeroState,
    setShowZeroState
  }
}
