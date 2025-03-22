import { getEbbDb } from './ebbDb'

export interface BlockingPreferenceDb {
  id: string
  app_id?: string
  tag_id?: string
  workflow_id: string
  created_at: string
}

const saveWorkflowBlockingPreferences = async (
  workflowId: string,
  preferences: Partial<BlockingPreferenceDb>[]
): Promise<void> => {
  const ebbDb = await getEbbDb()
  const now = new Date().toISOString()
  
  // Delete existing preferences for this workflow
  await ebbDb.execute('DELETE FROM blocking_preference WHERE workflow_id = ?', [workflowId])
  
  // Insert new preferences
  for (const pref of preferences) {
    await ebbDb.execute(
      `INSERT INTO blocking_preference (id, app_id, tag_id, workflow_id, created_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [pref.id, pref.app_id || null, pref.tag_id || null, workflowId, now]
    )
  }
}

const getWorkflowBlockingPreferences = async (workflowId: string): Promise<{
  preferences: BlockingPreferenceDb[]
}> => {
  const ebbDb = await getEbbDb()
  
  // Get preferences for specific workflow
  const preferences = await ebbDb.select<BlockingPreferenceDb[]>(
    'SELECT * FROM blocking_preference WHERE workflow_id = ?',
    [workflowId]
  )
  
  return { preferences }
}

export const BlockingPreferenceRepo = {
  saveWorkflowBlockingPreferences,
  getWorkflowBlockingPreferences
} 
