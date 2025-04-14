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

let currentShortcut = ''
let isInitialized = false

export const loadShortcut = async (): Promise<string> => {
  try {
    const savedShortcut = await UserPreferenceRepo.getPreference(SHORTCUT_KEY)
    if (savedShortcut !== null) {
      currentShortcut = savedShortcut
      return savedShortcut
    }
  } catch (err) {
    logError(`Failed to load shortcut from database: ${err}`)
  }
  currentShortcut = ''
  return ''
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
    if (currentShortcut === shortcut) return

    if (currentShortcut) {
      await unregisterShortcutTauri(currentShortcut)
    }

    await registerShortcutTauri(shortcut, (event) => {
      if (event.state === 'Pressed') {
        emit(SHORTCUT_EVENT)
      }
    })
    currentShortcut = shortcut
  } catch (err) {
    logError(`(Global) Failed to register shortcut ${shortcut}: ${err}`)
  }
}

export const updateGlobalShortcut = async (newShortcut: string): Promise<void> => {
  if (!isInitialized) {
    logError('(Global) Cannot update shortcut before initialization')
    return
  }
  if (newShortcut === currentShortcut) {
    return
  }

  try {
    await unregisterShortcutTauri(currentShortcut)
  } catch (err) {
    logError(`(Global) Failed to unregister old shortcut ${currentShortcut}: ${err}`)
  }

  await saveShortcut(newShortcut)
  await registerShortcut(newShortcut)
}

export const initializeGlobalShortcut = async (): Promise<void> => {
  if (isInitialized) {
    return
  }

  const shortcutToRegister = await loadShortcut()
  await registerShortcut(shortcutToRegister)
  isInitialized = true
}

export const getCurrentShortcut = (): string => {
  if (!isInitialized) {
    return ''
  }
  return currentShortcut
}

export const unregisterAllManagedShortcuts = async (): Promise<void> => {
  if (isInitialized && currentShortcut) {
    try {
      await unregisterShortcutTauri(currentShortcut)
    } catch (err) {
      logError(`(Global) Failed to unregister ${currentShortcut} during cleanup: ${err}`)
    }
  }
  isInitialized = false
}
