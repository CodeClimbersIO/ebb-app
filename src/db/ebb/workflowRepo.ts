import { getEbbDb } from './ebbDb'

export interface WorkflowDb {
  id: string
  name: string
  settings: string // JSON stringified settings including playlist, apps, etc.
  last_selected: string | null
  created_at: string
  updated_at: string
  is_smart_default: boolean
}

export interface WorkflowSettings {
  typewriterMode: boolean
  hasBreathing: boolean
  hasMusic: boolean
  isAllowList?: boolean
  defaultDuration: number | null
  selectedPlaylist?: string | null
  selectedPlaylistName?: string | null
  difficulty?: 'easy' | 'medium' | 'hard' | null
}

const getWorkflows = async (): Promise<WorkflowDb[]> => {
  const ebbDb = await getEbbDb()
  const workflows = await ebbDb.select<WorkflowDb[]>(
    'SELECT * FROM workflow ORDER BY last_selected DESC',
    []
  )
  
  return workflows
}

const getWorkflowById = async (id: string): Promise<WorkflowDb | null> => {
  const ebbDb = await getEbbDb()
  const workflows = await ebbDb.select<WorkflowDb[]>(
    'SELECT * FROM workflow WHERE id = ?',
    [id]
  )
  
  return workflows.length > 0 ? workflows[0] : null
}

const saveWorkflow = async (workflow: Partial<WorkflowDb>): Promise<string> => {
  const ebbDb = await getEbbDb()
  const now = new Date().toISOString()
  
  if (workflow.id) {
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
    const newId = crypto.randomUUID()
    
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

const deleteWorkflow = async (id: string): Promise<void> => {
  const ebbDb = await getEbbDb()
  await ebbDb.execute('DELETE FROM workflow WHERE id = ?', [id])
}

const updateLastSelected = async (id: string): Promise<void> => {
  const ebbDb = await getEbbDb()
  const now = new Date().toISOString()
  
  await ebbDb.execute(
    'UPDATE workflow SET last_selected = ?, updated_at = ? WHERE id = ?',
    [now, now, id]
  )
}

const updateWorkflowName = async (id: string, name: string): Promise<void> => {
  const ebbDb = await getEbbDb()
  const now = new Date().toISOString()

  await ebbDb.execute(
    'UPDATE workflow SET name = ?, updated_at = ? WHERE id = ?',
    [name, now, id]
  )
}

const getSmartDefaultWorkflow = async (): Promise<WorkflowDb | null> => {
  const ebbDb = await getEbbDb()
  const [workflow] = await ebbDb.select<WorkflowDb[]>(
    'SELECT * FROM workflow WHERE is_smart_default = 1',
    []
  )
  return workflow
}

export const WorkflowRepo = {
  getWorkflows,
  getWorkflowById,
  saveWorkflow,
  deleteWorkflow,
  updateLastSelected,
  updateWorkflowName,
  getSmartDefaultWorkflow
}
