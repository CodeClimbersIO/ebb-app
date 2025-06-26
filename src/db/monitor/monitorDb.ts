import Database from '@tauri-apps/plugin-sql'
import { homeDir, join } from '@tauri-apps/api/path'

let monitorDb: Database | null = null
let monitorDbPromise: Promise<Database> | null = null

const getMonitorDb = async () => {
  if (monitorDb) {
    return monitorDb
  }

  if (monitorDbPromise) {
    return monitorDbPromise
  }

  monitorDbPromise = (async () => {
    const homeDirectory = await homeDir()
    const monitorDbPath = await join(
      homeDirectory,
      '.codeclimbers',
      'codeclimbers-desktop.sqlite',
    )
    monitorDb = await Database.load(`sqlite:${monitorDbPath}`)
    monitorDbPromise = null
    return monitorDb
  })()

  return monitorDbPromise
}

export const MonitorDb = {
  getMonitorDb,
}
