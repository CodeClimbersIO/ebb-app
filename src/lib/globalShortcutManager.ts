import { Store, load as loadStore } from '@tauri-apps/plugin-store'
import {
  register as registerShortcutTauri,
  unregister as unregisterShortcutTauri,
} from '@tauri-apps/plugin-global-shortcut'
import { emit } from '@tauri-apps/api/event'
import { error as logError } from '@tauri-apps/plugin-log'

const STORE_FILE = '.settings.dat'
const SHORTCUT_KEY = 'global-focus-shortcut'
export const DEFAULT_SHORTCUT = 'CommandOrControl+E'
export const SHORTCUT_EVENT = 'global-shortcut-triggered'

let storeInstance: Store | null = null // Variable to hold the loaded store instance

let currentShortcut = DEFAULT_SHORTCUT
let isInitialized = false

// Async function to get/load the store instance
const getStoreInstance = async (): Promise<Store> => {
  if (!storeInstance) {
    try {
      // Use the imported load function
      storeInstance = await loadStore(STORE_FILE)
      console.log('Store instance loaded successfully.')
    } catch (err) {
      logError(`Failed to load store ${STORE_FILE}: ${err}`)
      // Handle error appropriately - maybe throw or return a dummy?
      // For now, let's throw to indicate a critical failure.
      throw new Error(`Failed to load store: ${err}`)
    }
  }
  return storeInstance
}

// Loads the shortcut from store, updates the internal variable, and returns it.
export const loadShortcut = async (): Promise<string> => {
  try {
    const store = await getStoreInstance() // Get store instance
    const savedShortcut = await store.get<string>(SHORTCUT_KEY)
    if (savedShortcut) {
      console.log('Loaded shortcut from store:', savedShortcut)
      currentShortcut = savedShortcut // Update internal state on load
      return savedShortcut
    }
  } catch (err) {
    logError(`Failed to load shortcut from store: ${err}`)
  }
  console.log('Using default shortcut:', DEFAULT_SHORTCUT)
  currentShortcut = DEFAULT_SHORTCUT // Ensure internal state matches default
  return DEFAULT_SHORTCUT
}

const saveShortcut = async (shortcut: string): Promise<void> => {
  try {
    const store = await getStoreInstance() // Get store instance
    await store.set(SHORTCUT_KEY, shortcut)
    await store.save() // Persist the changes
    console.log('Saved shortcut to store:', shortcut)
  } catch (err) {
    logError(`Failed to save shortcut ${shortcut} to store: ${err}`)
  }
}

// Registers the provided shortcut globally. Handles unregistering if already registered.
const registerShortcut = async (shortcut: string): Promise<void> => {
  try {
    // Always try to unregister the current shortcut first
    try {
      await unregisterShortcutTauri(currentShortcut)
      console.log('(Global) Unregistered current shortcut:', currentShortcut)
    } catch {
      // Ignore errors here as the shortcut might not be registered
    }

    // Also try to unregister the new shortcut if it's different
    if (shortcut !== currentShortcut) {
      try {
        await unregisterShortcutTauri(shortcut)
        console.log('(Global) Unregistered new shortcut:', shortcut)
      } catch {
        // Ignore errors here as the shortcut might not be registered
      }
    }

    // Now register the new shortcut
    await registerShortcutTauri(shortcut, (event) => {
      if (event.state === 'Pressed') {
        console.log('(Global) Shortcut pressed:', shortcut)
        emit(SHORTCUT_EVENT)
      }
    })
    currentShortcut = shortcut // Update internal tracker
    console.log('(Global) Registered:', shortcut)
  } catch (err) {
    logError(`(Global) Failed to register shortcut ${shortcut}: ${err}`)
  }
}

// Unregisters the current global shortcut, saves the new one, and registers the new one.
export const updateGlobalShortcut = async (newShortcut: string): Promise<void> => {
  if (!isInitialized) {
    logError('(Global) Cannot update shortcut before initialization')
    return
  }
  if (newShortcut === currentShortcut) {
    console.log('(Global) Shortcut unchanged, skipping update.')
    return
  }

  try {
    // Unregister the currently active shortcut
    await unregisterShortcutTauri(currentShortcut)
    console.log('(Global) Unregistered old:', currentShortcut)
  } catch (err) {
    // Log error but proceed, maybe it wasn't registered properly
    logError(`(Global) Failed to unregister old shortcut ${currentShortcut}: ${err}`)
  }

  await saveShortcut(newShortcut)
  await registerShortcut(newShortcut) // This will register the new one and update currentShortcut
}

// Loads the shortcut from store (or uses default) and registers it globally.
export const initializeGlobalShortcut = async (): Promise<void> => {
  if (isInitialized) {
    console.log('(Global) Already initialized.')
    return
  }
  console.log('(Global) Initializing shortcut manager...')
  // Ensure store is loaded before loading shortcut value
  try {
    await getStoreInstance()
  } catch (err) {
    logError(`(Global) Initialization failed: Could not load store (${err}). Using default shortcut.`)
    currentShortcut = DEFAULT_SHORTCUT // Set internal state to default
    // Still attempt to register default shortcut even if store failed
    await registerShortcut(currentShortcut)
    isInitialized = true // Mark as initialized even on store load failure
    return
  }

  const shortcutToRegister = await loadShortcut() // Now uses the loaded store via getStoreInstance()
  await registerShortcut(shortcutToRegister) // Registers the loaded/default shortcut
  isInitialized = true
  console.log('(Global) Shortcut manager initialized.')
}

// Gets the shortcut string currently managed (loaded from store or default).
export const getCurrentShortcut = (): string => {
  // Ensure it's loaded if not initialized, though initialize should be called first
  if (!isInitialized) {
      console.warn('(Global) getCurrentShortcut called before initialization. Returning default.')
      return DEFAULT_SHORTCUT
  }
  return currentShortcut
}

// Unregisters all shortcuts managed by this module (useful on cleanup/shutdown)
export const unregisterAllManagedShortcuts = async (): Promise<void> => {
    if (isInitialized && currentShortcut) {
        try {
            await unregisterShortcutTauri(currentShortcut)
            console.log('(Global) Unregistered:', currentShortcut)
        } catch (err) {
            logError(`(Global) Failed to unregister ${currentShortcut} during cleanup: ${err}`)
        }
    }
    isInitialized = false
}
