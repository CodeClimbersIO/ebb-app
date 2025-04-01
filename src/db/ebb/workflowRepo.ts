import { getEbbDb } from './ebbDb'

export interface WorkflowDb {
  id: string
  name: string
  settings: string // JSON stringified settings including playlist, apps, etc.
  last_selected: string | null
  created_at: string
  updated_at: string
}

export interface WorkflowSettings {
  hasTypewriter: boolean
  hasBreathing: boolean
  hasMusic: boolean
  isAllowList?: boolean
  defaultDuration: number | null
  selectedPlaylist?: string | null
  selectedPlaylistName?: string | null
  difficulty?: 'easy' | 'medium' | 'hard' | null
}

// Get all workflows
const getWorkflows = async (): Promise<WorkflowDb[]> => {
  const ebbDb = await getEbbDb()
  const workflows = await ebbDb.select<WorkflowDb[]>(
    'SELECT * FROM workflow ORDER BY last_selected DESC',
    []
  )
  
  return workflows
}

// Get a single workflow by ID
const getWorkflowById = async (id: string): Promise<WorkflowDb | null> => {
  const ebbDb = await getEbbDb()
  const workflows = await ebbDb.select<WorkflowDb[]>(
    'SELECT * FROM workflow WHERE id = ?',
    [id]
  )
  
  return workflows.length > 0 ? workflows[0] : null
}

// Save a workflow
const saveWorkflow = async (workflow: Partial<WorkflowDb>): Promise<string> => {
  const ebbDb = await getEbbDb()
  const now = new Date().toISOString()
  
  if (workflow.id) {
    // Update existing workflow
    await ebbDb.execute(
      `UPDATE workflow 
       SET name = ?, settings = ?, last_selected = ?, updated_at = ? 
       WHERE id = ?`,
      [
        workflow.name, 
        workflow.settings, 
        workflow.last_selected || null, 
        now, 
        workflow.id
      ]
    )
    return workflow.id
  } else {
    // Generate new ID for new workflow
    const newId = crypto.randomUUID()
    
    // Insert new workflow
    await ebbDb.execute(
      `INSERT INTO workflow (id, name, settings, last_selected, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        newId,
        workflow.name, 
        workflow.settings, 
        workflow.last_selected || null, 
        now, 
        now
      ]
    )
    return newId
  }
}

// Delete a workflow
const deleteWorkflow = async (id: string): Promise<void> => {
  const ebbDb = await getEbbDb()
  await ebbDb.execute('DELETE FROM workflow WHERE id = ?', [id])
}

// Update last selected timestamp
const updateLastSelected = async (id: string): Promise<void> => {
  const ebbDb = await getEbbDb()
  const now = new Date().toISOString()
  
  await ebbDb.execute(
    'UPDATE workflow SET last_selected = ?, updated_at = ? WHERE id = ?',
    [now, now, id]
  )
}

export const WorkflowRepo = {
  getWorkflows,
  getWorkflowById,
  saveWorkflow,
  deleteWorkflow,
  updateLastSelected
}
