import { info } from '@tauri-apps/plugin-log'
import { DateTime } from 'luxon'

/**
 * takes a function and will accept the first request and ignore all subsequent requests with the same id
 */
const running = new Map<string, boolean>()

const work = async (id: string, fn: ()=>Promise<void>): Promise<void> => {
  if(running.get(id)) return
  running.set(id, true)
  await fn()
}

const lastRunMap = new Map<string, DateTime>()

const debounceWork = async (fn: ()=>Promise<void>, id='default', debounceTimeSec = 1): Promise<void> => {

  const lastRun = lastRunMap.get(id) || DateTime.now().minus({ seconds: 10 })
  const diffToNow = DateTime.now().diff(lastRun, 'seconds').seconds
  info(`diffToNow: ${diffToNow}`)
  info(`debounceTimeSec: ${debounceTimeSec}`)
  if(diffToNow < debounceTimeSec) return
  lastRunMap.set(id, DateTime.now())
  await fn()
}

export const EbbWorker = {
  work,
  debounceWork
}
