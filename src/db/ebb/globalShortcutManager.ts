import {
  register as registerShortcutTauri,
  unregister as unregisterShortcutTauri
} from '@tauri-apps/plugin-global-shortcut'
import { emit } from '@tauri-apps/api/event'
import { error as logError } from '@tauri-apps/plugin-log'
import { UserPreferenceRepo } from './userPreferenceRepo'

export const DEFAULT_SHORTCUT = 'CommandOrControl+E'
export const SHORTCUT_EVENT = 'global-shortcut-triggered'
const SHORTCUT_KEY = 'global-focus-shortcut'

let isInitialized = false

const getCurrentShortcutFromDb = async (): Promise<string> => {
  try {
    const savedShortcut = await UserPreferenceRepo.getPreference(SHORTCUT_KEY)
    return savedShortcut ?? ''
  } catch (err) {
    logError(`Failed to load shortcut from database: ${err}`)
    return ''
  }
}

export const loadShortcut = async (): Promise<string> => {
  return getCurrentShortcutFromDb()
}

const saveShortcut = async (shortcut: string): Promise<void> => {
  try {
    await UserPreferenceRepo.setPreference(SHORTCUT_KEY, shortcut)
  } catch (err) {
    logError(`Failed to save shortcut ${shortcut} to database: ${err}`)
  }
}

const registerShortcut = async (shortcut: string): Promise<void> => {
  try {
    if (!shortcut) return
    
    const currentShortcut = await getCurrentShortcutFromDb()
    if (currentShortcut === shortcut) return

    if (currentShortcut) {
      await unregisterShortcutTauri(currentShortcut)
    }

    await registerShortcutTauri(shortcut, (event) => {
      if (event.state === 'Pressed') {
        emit(SHORTCUT_EVENT)
      }
    })
  } catch (err) {
    logError(`(Global) Failed to register shortcut ${shortcut}: ${err}`)
  }
}

export const updateGlobalShortcut = async (newShortcut: string): Promise<void> => {
  if (!isInitialized) {
    logError('(Global) Cannot update shortcut before initialization')
    return
  }

  const currentShortcut = await getCurrentShortcutFromDb()
  if (newShortcut === currentShortcut) {
    return
  }

  try {
    if (currentShortcut) {
      await unregisterShortcutTauri(currentShortcut)
    }
    
    if (newShortcut) {
      await registerShortcutTauri(newShortcut, (event) => {
        if (event.state === 'Pressed') {
          emit(SHORTCUT_EVENT)
        }
      })
    }
    
    await saveShortcut(newShortcut)
  } catch (err) {
    logError(`(Global) Failed to update shortcut: ${err}`)
  }
}

export const initializeGlobalShortcut = async (): Promise<void> => {
  if (isInitialized) {
    return
  }

  const shortcutToRegister = await getCurrentShortcutFromDb()
  await registerShortcut(shortcutToRegister)
  isInitialized = true
}

export const getCurrentShortcut = async (): Promise<string> => {
  if (!isInitialized) {
    return ''
  }
  return getCurrentShortcutFromDb()
}

export const unregisterAllManagedShortcuts = async (): Promise<void> => {
  if (isInitialized) {
    const currentShortcut = await getCurrentShortcutFromDb()
    if (currentShortcut) {
      try {
        await unregisterShortcutTauri(currentShortcut)
      } catch (err) {
        logError(`(Global) Failed to unregister ${currentShortcut} during cleanup: ${err}`)
      }
    }
  }
  isInitialized = false
}
