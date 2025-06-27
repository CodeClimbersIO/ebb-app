import Database from '@tauri-apps/plugin-sql'
import { homeDir, join } from '@tauri-apps/api/path'

let ebbDb: Database | null = null
let ebbDbPromise: Promise<Database> | null = null

export const getEbbDb = async () => {
  if (ebbDb) {
    return ebbDb
  }
  
  // If we're already in the process of loading, return that promise
  if (ebbDbPromise) {
    return ebbDbPromise
  }
  
  ebbDbPromise = (async () => {
    const homeDirectory = await homeDir()
    const ebbDbPath = await join(homeDirectory, '.ebb', 'ebb-desktop.sqlite')
    const db = await Database.load(`sqlite:${ebbDbPath}`)
    ebbDb = db
    ebbDbPromise = null
    return db
  })()
  
  return ebbDbPromise
}

type DbOperation<T> = () => Promise<T>

export const withRetry = async <T>(operation: DbOperation<T>, retryableErrors = ['database is locked']): Promise<T> => {
  const delays = [1000, 3000, 10000] // 1s, 3s, 10s in milliseconds
  
  async function executeWithRetry(attempt = 0): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const shouldRetry = retryableErrors.some(errMsg => errorMessage.includes(errMsg))
      
      if (shouldRetry && attempt < delays.length) {
        console.warn(`Database operation failed with error: ${errorMessage}. Retrying in ${delays[attempt]/1000}s...`)
        await new Promise(resolve => setTimeout(resolve, delays[attempt]))
        return executeWithRetry(attempt + 1)
      }
      
      throw error // If we've exhausted all retries or error isn't retryable
    }
  }
  
  return executeWithRetry()
}
