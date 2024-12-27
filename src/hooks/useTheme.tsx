import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

export function useTheme() {
  // Check if we're running in the browser
  const isBrowser = typeof window !== 'undefined'

  const [theme, setTheme] = useState<Theme>(() => {
    if (!isBrowser) return 'light' // Default for SSR

    // Check localStorage first
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) return savedTheme

    // If no saved preference, check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    if (!isBrowser) return

    // Safely access document
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)

    // Save to localStorage
    localStorage.setItem('theme', theme)
  }, [theme, isBrowser])

  return { theme, setTheme }
}