// provide wrapper around listen so we can make sure we are not listening to the same event multiple times with the same id
import { listen, UnlistenFn } from '@tauri-apps/api/event'

const listeners = new Map<string, () => void>()
export const EbbListen = {  
  listen: async (event: string, callback: (data: unknown) => void, id: string) => {
    if (listeners.has(id)) {
      const unlisten = listeners.get(id)
      if (unlisten) {
        unlisten()
      }
    }
    const unlisten = await listen(event, callback)
    const unlistenWrapper = EbbListen.unlisten(unlisten, id)
    listeners.set(id, unlistenWrapper)
    return unlistenWrapper
  },
  unlisten: (unlisten: () => void, id: string): UnlistenFn => {
    return () => {
      unlisten()
      listeners.delete(id)
    }
  }
}
