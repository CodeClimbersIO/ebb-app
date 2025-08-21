import { useState, useEffect, useCallback } from 'react'

const SEQUENCE = 'spotify'
const RESET_TIMEOUT = 3000 // Reset sequence after 3 seconds of inactivity

// Original purple theme colors
const ORIGINAL_THEME = {
  light: { primary: '262.1 83.3% 57.8%', ring: '262.1 83.3% 57.8%' },
  dark: { primary: '263.4 70% 50.4%', ring: '263.4 70% 50.4%' }
}

// Spotify green theme colors  
const SPOTIFY_THEME = {
  light: { primary: '141 73% 42%', ring: '141 73% 42%' },
  dark: { primary: '141 73% 45%', ring: '141 73% 45%' }
}

export const useSpotifyEasterEgg = () => {
  const [currentSequence, setCurrentSequence] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [isSpotifyTheme, setIsSpotifyTheme] = useState(() => {
    return localStorage.getItem('spotify-theme') === 'true'
  })

  const resetSequence = useCallback(() => {
    setCurrentSequence('')
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
  }, [timeoutId])

  const applyTheme = useCallback((useSpotifyTheme: boolean) => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    const theme = useSpotifyTheme ? SPOTIFY_THEME : ORIGINAL_THEME
    const colors = isDarkMode ? theme.dark : theme.light
    
    const root = document.documentElement
    root.style.setProperty('--primary', colors.primary)
    root.style.setProperty('--ring', colors.ring)
  }, [])

  const toggleSpotifyTheme = useCallback(() => {
    const newThemeState = !isSpotifyTheme
    setIsSpotifyTheme(newThemeState)
    localStorage.setItem('spotify-theme', newThemeState.toString())
    applyTheme(newThemeState)
  }, [isSpotifyTheme, applyTheme])

  const triggerConfetti = useCallback(() => {
    toggleSpotifyTheme()
    setShowConfetti(true)
    // Hide confetti after animation
    setTimeout(() => {
      setShowConfetti(false)
    }, 4000)
  }, [toggleSpotifyTheme])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          (event.target as HTMLElement)?.contentEditable === 'true') {
        return
      }

      const key = event.key.toLowerCase()
      
      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      const newSequence = currentSequence + key
      
      if (SEQUENCE.startsWith(newSequence)) {
        setCurrentSequence(newSequence)
        
        // Check if sequence is complete
        if (newSequence === SEQUENCE) {
          triggerConfetti()
          resetSequence()
          return
        }
        
        // Set timeout to reset sequence
        const newTimeoutId = setTimeout(resetSequence, RESET_TIMEOUT)
        setTimeoutId(newTimeoutId)
      } else {
        // Wrong key, reset sequence
        resetSequence()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [currentSequence, timeoutId, resetSequence, triggerConfetti])

  // Apply theme on mount and when dark mode changes
  useEffect(() => {
    applyTheme(isSpotifyTheme)
    
    // Listen for theme changes (light/dark mode toggle)
    const observer = new MutationObserver(() => {
      applyTheme(isSpotifyTheme)
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [isSpotifyTheme, applyTheme])

  return { showConfetti, isSpotifyTheme }
}
