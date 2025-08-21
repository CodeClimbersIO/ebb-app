import { useState, useEffect, useCallback } from 'react'

const SEQUENCE = 'flow'
const RESET_TIMEOUT = 3000 // Reset sequence after 3 seconds of inactivity

// Original purple theme colors
const ORIGINAL_THEME = {
  light: { 
    primary: '262.1 83.3% 57.8%', 
    ring: '262.1 83.3% 57.8%',
    'primary-50': '262.1 83.3% 97%',
    'primary-100': '262.1 83.3% 92%',
    'primary-200': '262.1 83.3% 86%',
    'primary-300': '262.1 83.3% 77%',
    'primary-400': '262.1 83.3% 67%',
    'primary-500': '262.1 83.3% 57.8%',
    'primary-600': '262.1 83.3% 48%',
    'primary-700': '262.1 83.3% 38%',
    'primary-800': '262.1 83.3% 28%',
    'primary-900': '262.1 83.3% 18%',
    'primary-950': '262.1 83.3% 8%'
  },
  dark: { 
    primary: '263.4 70% 50.4%', 
    ring: '263.4 70% 50.4%',
    'primary-50': '263.4 70% 95%',
    'primary-100': '263.4 70% 88%',
    'primary-200': '263.4 70% 80%',
    'primary-300': '263.4 70% 70%',
    'primary-400': '263.4 70% 60%',
    'primary-500': '263.4 70% 50.4%',
    'primary-600': '263.4 70% 40%',
    'primary-700': '263.4 70% 30%',
    'primary-800': '263.4 70% 20%',
    'primary-900': '263.4 70% 12%',
    'primary-950': '263.4 70% 6%'
  }
}

// Spotify green theme colors  
const SPOTIFY_THEME = {
  light: { 
    primary: '141 73% 42%', 
    ring: '141 73% 42%',
    'primary-50': '141 73% 97%',
    'primary-100': '141 73% 92%',
    'primary-200': '141 73% 86%',
    'primary-300': '141 73% 77%',
    'primary-400': '141 73% 57%',
    'primary-500': '141 73% 42%',
    'primary-600': '141 73% 32%',
    'primary-700': '141 73% 22%',
    'primary-800': '141 73% 15%',
    'primary-900': '141 73% 10%',
    'primary-950': '141 73% 5%'
  },
  dark: { 
    primary: '141 73% 45%', 
    ring: '141 73% 45%',
    'primary-50': '141 73% 95%',
    'primary-100': '141 73% 88%',
    'primary-200': '141 73% 80%',
    'primary-300': '141 73% 70%',
    'primary-400': '141 73% 60%',
    'primary-500': '141 73% 45%',
    'primary-600': '141 73% 35%',
    'primary-700': '141 73% 25%',
    'primary-800': '141 73% 18%',
    'primary-900': '141 73% 12%',
    'primary-950': '141 73% 6%'
  }
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
    // Apply all primary color variations
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })
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
