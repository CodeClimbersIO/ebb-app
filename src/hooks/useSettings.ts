import { useState, useEffect } from 'react'

export const useSettings = () => {
  const [showZeroState, setShowZeroState] = useState(() => {
    const saved = localStorage.getItem('settings.showZeroState')
    return saved ? JSON.parse(saved) : false
  })

  const [userRole, setUserRole] = useState<'developer' | 'designer' | 'creator'>(() => {
    const saved = localStorage.getItem('settings.userRole')
    return saved ? (saved as 'developer' | 'designer' | 'creator') : 'developer'
  })

  useEffect(() => {
    localStorage.setItem('settings.showZeroState', JSON.stringify(showZeroState))
  }, [showZeroState])

  useEffect(() => {
    localStorage.setItem('settings.userRole', userRole)
  }, [userRole])

  const toggleZeroState = (): void => setShowZeroState((prev: boolean): boolean => !prev)

  return {
    showZeroState,
    toggleZeroState,
    userRole,
    setUserRole
  }
} 
