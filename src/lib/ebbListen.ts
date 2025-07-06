// provide wrapper around listen so we can make sure we are not listening to the same event multiple times with the same id

import { listen } from '@tauri-apps/api/event'
import { warn } from '@tauri-apps/plugin-log'

const listeners = new Map<string, () => void>()
export const EbbListen = {  
  listen: async (event: string, callback: (data: unknown) => void, id: string) => {
    if (listeners.has(id)) {
      warn(`TROUBLESHOOTING: listener already exists for id ${id}`)
      const unlisten = listeners.get(id)
      if (unlisten) {
        unlisten()
      }
    }
    const unlisten = await listen(event, callback)
    listeners.set(id, unlisten)
    return unlisten
  },
  unlisten: async (unlisten: () => void) => {
    unlisten()
  }
}
