import {
  register as registerShortcutTauri,
  unregister as unregisterShortcutTauri
} from '@tauri-apps/plugin-global-shortcut'
import { emit } from '@tauri-apps/api/event'
import { logAndToastError } from '@/lib/utils/ebbError.util'
import { UserPreferenceRepo } from '@/db/ebb/userPreferenceRepo'
import { info as logInfo, error as logError, error } from '@tauri-apps/plugin-log'

export const DEFAULT_SHORTCUT = 'CommandOrControl+E'
export const SHORTCUT_EVENT = 'global-shortcut-triggered'
const SHORTCUT_KEY = 'global-focus-shortcut'

let isInitialized = false

const getCurrentShortcutFromDb = async (): Promise<string> => {
  try {
    const savedShortcut = await UserPreferenceRepo.getPreference(SHORTCUT_KEY)
    return savedShortcut ?? ''
  } catch (err) {
    logAndToastError(`Failed to load shortcut from database: ${err}`, error)
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
    logAndToastError(`Failed to save shortcut ${shortcut} to database: ${err}`, error)
  }
}

export const updateGlobalShortcut = async (newShortcut: string): Promise<void> => {
  if (!isInitialized) {
    logAndToastError('Cannot update shortcut before initialization', error)
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
      try {
        await registerShortcutTauri(newShortcut, (event) => {
          if (event.state === 'Pressed') {
            emit(SHORTCUT_EVENT)
          }
        })
      } catch (registrationError) {
        if (newShortcut !== DEFAULT_SHORTCUT) {
          logAndToastError(`Explicit error during shortcut update registration: ${registrationError}`, error)
        }
      }
    }
    
    await saveShortcut(newShortcut)
  } catch (err) {
    logAndToastError(`Failed to update shortcut: ${err}`, error)
  }
}

export const initializeGlobalShortcut = async (): Promise<void> => {
  if (isInitialized) {
    return
  }

  try {
    const shortcutToRegister = await getCurrentShortcutFromDb()
    
    if (shortcutToRegister) {
      await unregisterShortcutTauri(shortcutToRegister)
    }

    if (shortcutToRegister) {
      await registerShortcutTauri(shortcutToRegister, (event) => {
        logInfo(`(Global) Shortcut event: ${event.state}`)
        if (event.state === 'Pressed') {
          emit(SHORTCUT_EVENT)
        }
      })
    }

    isInitialized = true
  } catch (err) {
    // appears to happen every time we register a shortcut even if it is successful. Probably a bug with the plugin.
    logError(`Failed to initialize global shortcut: ${err}`)
    isInitialized = true
  }
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
        logAndToastError(`Failed to unregister ${currentShortcut} during cleanup: ${err}`, error)
      }
    }
  }
  isInitialized = false
}
