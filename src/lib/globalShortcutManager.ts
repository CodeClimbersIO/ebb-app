import { Store, load as loadStore } from '@tauri-apps/plugin-store'
import {
  register as registerShortcutTauri,
  unregister as unregisterShortcutTauri,
} from '@tauri-apps/plugin-global-shortcut'
import { emit } from '@tauri-apps/api/event'

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
    } catch (err) {
      console.error(`Failed to load store ${STORE_FILE}: ${err}`)
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
      currentShortcut = savedShortcut
      return savedShortcut
    }
  } catch (err) {
    console.error(`Failed to load shortcut from store: ${err}`)
  }
  currentShortcut = ''
  return ''
}

const saveShortcut = async (shortcut: string): Promise<void> => {
  try {
    const store = await getStoreInstance()
    await store.set(SHORTCUT_KEY, shortcut)
    await store.save()
  } catch (err) {
    console.error(`Failed to save shortcut ${shortcut} to store: ${err}`)
  }
}

const registerShortcut = async (shortcut: string): Promise<void> => {
  try {
    await unregisterShortcutTauri(currentShortcut)

    if (shortcut !== currentShortcut) {
      await unregisterShortcutTauri(shortcut)
    }

    if (shortcut) {
      await registerShortcutTauri(shortcut, (event) => {
        if (event.state === 'Pressed') {
          emit(SHORTCUT_EVENT)
        }
      })
    }
    currentShortcut = shortcut
  } catch (err) {
    console.error(`(Global) Failed to register shortcut ${shortcut}: ${err}`)
  }
}

export const updateGlobalShortcut = async (newShortcut: string): Promise<void> => {
  if (!isInitialized) {
    console.error('(Global) Cannot update shortcut before initialization')
    return
  }
  if (newShortcut === currentShortcut) {
    return
  }

  try {
    await unregisterShortcutTauri(currentShortcut)
  } catch (err) {
    console.error(`(Global) Failed to unregister old shortcut ${currentShortcut}: ${err}`)
  }

  await saveShortcut(newShortcut)
  await registerShortcut(newShortcut)
}

export const initializeGlobalShortcut = async (): Promise<void> => {
  if (isInitialized) {
    return
  }
  try {
    await getStoreInstance()
  } catch (err) {
    console.error(`(Global) Initialization failed: Could not load store (${err})`)
    currentShortcut = ''
    isInitialized = true
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
            console.error(`(Global) Failed to unregister ${currentShortcut} during cleanup: ${err}`)
        }
    }
    isInitialized = false
}
