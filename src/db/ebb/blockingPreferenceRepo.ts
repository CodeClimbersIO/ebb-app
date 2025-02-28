import { getEbbDb } from './ebbDb'

export interface BlockingPreferenceDb {
  id: string
  app_id?: string
  tag_id?: string
  created_at: string
}

const saveBlockingPreferences = async (
  preferences: Partial<BlockingPreferenceDb>[]
): Promise<void> => {
  const ebbDb = await getEbbDb()
  const now = new Date().toISOString()
  
  await ebbDb.execute('DELETE FROM blocking_preference')
  
  for (const pref of preferences) {
    await ebbDb.execute(
      `INSERT INTO blocking_preference (id, app_id, tag_id, created_at) 
       VALUES (?, ?, ?, ?)`,
      [pref.id, pref.app_id || null, pref.tag_id || null, now]
    )
  }
}

const getBlockingPreferences = async (): Promise<{
  preferences: BlockingPreferenceDb[]
}> => {
  const ebbDb = await getEbbDb()
  const preferences = await ebbDb.select<BlockingPreferenceDb[]>(
    'SELECT * FROM blocking_preference'
  )
  
  return { preferences }
}

export const BlockingPreferenceRepo = {
  saveBlockingPreferences,
  getBlockingPreferences
} 
