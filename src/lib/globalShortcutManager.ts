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

let storeInstance: Store | null = null

let currentShortcut = ''
let isInitialized = false

const getStoreInstance = async (): Promise<Store> => {
  if (!storeInstance) {
    try {
      storeInstance = await loadStore(STORE_FILE)
      console.log('Store instance loaded successfully.')
    } catch (err) {
      logError(`Failed to load store ${STORE_FILE}: ${err}`)
      throw new Error(`Failed to load store: ${err}`)
    }
  }
  return storeInstance
}

export const loadShortcut = async (): Promise<string> => {
  try {
    const store = await getStoreInstance()
    const savedShortcut = await store.get<string>(SHORTCUT_KEY)
    if (savedShortcut !== null && savedShortcut !== undefined) {
      console.log('Loaded shortcut from store:', savedShortcut)
      currentShortcut = savedShortcut
      return savedShortcut
    }
  } catch (err) {
    logError(`Failed to load shortcut from store: ${err}`)
  }
  console.log('No shortcut found in store')
  currentShortcut = ''
  return ''
}

const saveShortcut = async (shortcut: string): Promise<void> => {
  try {
    const store = await getStoreInstance()
    await store.set(SHORTCUT_KEY, shortcut)
    await store.save()
    console.log('Saved shortcut to store:', shortcut)
  } catch (err) {
    logError(`Failed to save shortcut ${shortcut} to store: ${err}`)
  }
}

const registerShortcut = async (shortcut: string): Promise<void> => {
  try {
    try {
      await unregisterShortcutTauri(currentShortcut)
      console.log('(Global) Unregistered current shortcut:', currentShortcut)
    } catch {
      console.log('(Global) Ignoring unregister error - shortcut may not exist')
    }

    if (shortcut !== currentShortcut) {
      try {
        await unregisterShortcutTauri(shortcut)
        console.log('(Global) Unregistered new shortcut:', shortcut)
      } catch {
        console.log('(Global) Ignoring unregister error - shortcut may not exist')
      }
    }

    if (shortcut) {
      await registerShortcutTauri(shortcut, (event) => {
        if (event.state === 'Pressed') {
          console.log('(Global) Shortcut pressed:', shortcut)
          emit(SHORTCUT_EVENT)
        }
      })
      console.log('(Global) Registered:', shortcut)
    } else {
      console.log('(Global) No shortcut to register')
    }
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
    console.log('(Global) Shortcut unchanged, skipping update.')
    return
  }

  try {
    await unregisterShortcutTauri(currentShortcut)
    console.log('(Global) Unregistered old:', currentShortcut)
  } catch (err) {
    logError(`(Global) Failed to unregister old shortcut ${currentShortcut}: ${err}`)
  }

  await saveShortcut(newShortcut)
  await registerShortcut(newShortcut)
}

export const initializeGlobalShortcut = async (): Promise<void> => {
  if (isInitialized) {
    console.log('(Global) Already initialized.')
    return
  }
  console.log('(Global) Initializing shortcut manager...')
  try {
    await getStoreInstance()
  } catch (err) {
    logError(`(Global) Initialization failed: Could not load store (${err})`)
    currentShortcut = ''
    isInitialized = true
    return
  }

  const shortcutToRegister = await loadShortcut()
  await registerShortcut(shortcutToRegister)
  isInitialized = true
  console.log('(Global) Shortcut manager initialized.')
}

export const getCurrentShortcut = (): string => {
  if (!isInitialized) {
      console.warn('(Global) getCurrentShortcut called before initialization. Returning empty string.')
      return ''
  }
  return currentShortcut
}

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
