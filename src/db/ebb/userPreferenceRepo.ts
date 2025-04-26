import { getEbbDb, withRetry } from './ebbDb'

export interface UserPreferenceDb {
  key: string
  value: string
  updated_at: string
}

const getPreference = async (key: string): Promise<string | null> => {
  return withRetry(async () => {
    const ebbDb = await getEbbDb()
    const [preference] = await ebbDb.select<UserPreferenceDb[]>(
      'SELECT * FROM user_preference WHERE key = ?',
      [key]
    )
    
    return preference?.value ?? null
  })
}

const setPreference = async (key: string, value: string): Promise<void> => {
  return withRetry(async () => {
    const ebbDb = await getEbbDb()
    const now = new Date().toISOString()
    
    await ebbDb.execute(
      `INSERT INTO user_preference (key, value, updated_at) 
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET 
       value = excluded.value,
       updated_at = excluded.updated_at`,
      [key, value, now]
    )
  })
}

export const UserPreferenceRepo = {
  getPreference,
  setPreference
} 
