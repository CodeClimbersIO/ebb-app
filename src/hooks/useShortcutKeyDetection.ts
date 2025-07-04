import { useState, useEffect, useCallback } from 'react'
import { loadShortcut } from '@/api/ebbApi/shortcutApi'

interface ShortcutKeyState {
  pressedKeys: Set<string>
  isAnyShortcutKeyPressed: boolean
  getPressedShortcutKeys: () => string[]
}

// Map keyboard event codes/keys to shortcut database format
const mapKeyboardEventToShortcut = (event: KeyboardEvent): string | null => {
  // Handle modifier keys based on the actual key being pressed/released
  if (event.key === 'Meta') {
    return 'CommandOrControl'
  }
  
  if (event.key === 'Control') return 'Control'
  if (event.key === 'Alt') return 'Option'
  if (event.key === 'Shift') return 'Shift'
  if (event.key === 'Enter') return 'ENTER'
  if (event.key === ' ') return 'SPACE'
  
  // Handle regular keys - convert to uppercase for consistency
  if (event.key.length === 1) {
    return event.key.toUpperCase()
  }
  
  return null
}



export const useShortcutKeyDetection = (): ShortcutKeyState => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
  const [shortcutParts, setShortcutParts] = useState<string[]>([])

  // Load shortcut parts from database
  useEffect(() => {
    const loadShortcutParts = async () => {
      try {
        const shortcut = await loadShortcut()
        if (shortcut) {
          const parts = shortcut.split('+')
          setShortcutParts(parts)
        }
      } catch (error) {
        console.error('Failed to load shortcut parts:', error)
      }
    }
    
    loadShortcutParts()
  }, [])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const mappedKey = mapKeyboardEventToShortcut(event)
    if (mappedKey) {
      setPressedKeys(prev => new Set(prev).add(mappedKey))
    }
  }, [])

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const mappedKey = mapKeyboardEventToShortcut(event)
    if (mappedKey) {
      setPressedKeys(prev => {
        const newSet = new Set(prev)
        newSet.delete(mappedKey)
        return newSet
      })
    }
  }, [])

  const handleWindowBlur = useCallback(() => {
    // Clear all pressed keys when window loses focus
    setPressedKeys(new Set())
  }, [])

  // Set up keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleWindowBlur)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [handleKeyDown, handleKeyUp, handleWindowBlur])

  const getPressedShortcutKeys = useCallback((): string[] => {
    return shortcutParts.filter(part => pressedKeys.has(part))
  }, [shortcutParts, pressedKeys])

  const isAnyShortcutKeyPressed = shortcutParts.some(part => pressedKeys.has(part))

  return {
    pressedKeys,
    isAnyShortcutKeyPressed,
    getPressedShortcutKeys
  }
} 
