import { SearchOption } from '@/components/AppSelector'
import { WorkflowDb, WorkflowRepo, WorkflowSettings } from '@/db/ebb/workflowRepo'
import { BlockingPreferenceApi } from './blockingPreferenceApi'
export interface Workflow {
  id?: string
  name: string
  selectedApps: SearchOption[]
  selectedPlaylist?: string | null
  selectedPlaylistName?: string | null
  lastSelected?: number
  settings: {
    hasTypewriter: boolean
    hasBreathing: boolean
    hasMusic: boolean
    isAllowList?: boolean
    defaultDuration: number | null
  }
}

// Convert DB workflow to frontend Workflow format
const fromDbWorkflow = async (dbWorkflow: WorkflowDb): Promise<Workflow> => {
  const settings: WorkflowSettings = JSON.parse(dbWorkflow.settings)
  
  // Get blocking preferences from the blocking_preference table
  let selectedApps: SearchOption[] = []
  try {
    selectedApps = await BlockingPreferenceApi.getWorkflowBlockingPreferencesAsSearchOptions(dbWorkflow.id)
  } catch (error) {
    console.error(`Failed to load blocking preferences for workflow ${dbWorkflow.id}:`, error)
  }
  
  return {
    id: dbWorkflow.id,
    name: dbWorkflow.name,
    selectedApps: selectedApps,
    selectedPlaylist: settings.selectedPlaylist,
    selectedPlaylistName: settings.selectedPlaylistName,
    lastSelected: dbWorkflow.last_selected ? new Date(dbWorkflow.last_selected).getTime() : undefined,
    settings: {
      hasTypewriter: settings.hasTypewriter,
      hasBreathing: settings.hasBreathing,
      hasMusic: settings.hasMusic,
      isAllowList: settings.isAllowList || false,
      defaultDuration: settings.defaultDuration
    }
  }
}

// Convert frontend Workflow to DB format
const toDbWorkflow = (workflow: Workflow): Partial<WorkflowDb> => {
  const settings: WorkflowSettings = {
    hasTypewriter: workflow.settings.hasTypewriter,
    hasBreathing: workflow.settings.hasBreathing,
    hasMusic: workflow.settings.hasMusic,
    isAllowList: workflow.settings.isAllowList,
    defaultDuration: workflow.settings.defaultDuration,
    selectedPlaylist: workflow.selectedPlaylist,
    selectedPlaylistName: workflow.selectedPlaylistName
  }
  
  const dbWorkflow: Partial<WorkflowDb> = {
    name: workflow.name,
    settings: JSON.stringify(settings),
    last_selected: workflow.lastSelected ? new Date(workflow.lastSelected).toISOString() : null
  }

  // Only include ID if it exists (for existing workflows)
  if (workflow.id) {
    dbWorkflow.id = workflow.id
  }
  
  return dbWorkflow
}

const getWorkflows = async (): Promise<Workflow[]> => {
  
  // Get workflows
  const workflowsDb = await WorkflowRepo.getWorkflows()
  
  // Convert to frontend format
  const workflows = await Promise.all(workflowsDb.map(fromDbWorkflow))
  
  return workflows
}

// Get workflow by ID
const getWorkflowById = async (id: string): Promise<Workflow | null> => {
  const workflowDb = await WorkflowRepo.getWorkflowById(id)
  if (!workflowDb) return null
  
  return await fromDbWorkflow(workflowDb)
}

// Save workflow
const saveWorkflow = async (workflow: Workflow): Promise<Workflow> => {
  // Save the workflow metadata to the workflow table
  const dbWorkflow = toDbWorkflow(workflow)
  
  // If this is a new workflow (no ID), remove the ID field
  const isNewWorkflow = !workflow.id
  if (isNewWorkflow) {
    delete dbWorkflow.id
  }
  
  // Save workflow and get the ID (either existing or newly created)
  const workflowId = await WorkflowRepo.saveWorkflow(dbWorkflow)
  
  // Save the blocking preferences to the blocking_preference table
  await BlockingPreferenceApi.saveWorkflowBlockingPreferences(workflowId, workflow.selectedApps)
  
  // Return the saved workflow
  const savedWorkflow = await getWorkflowById(workflowId)
  if (!savedWorkflow) {
    throw new Error('Failed to retrieve saved workflow')
  }
  return savedWorkflow
}

// Delete workflow
const deleteWorkflow = async (id: string): Promise<void> => {
  // Delete the workflow
  await WorkflowRepo.deleteWorkflow(id)
  
  // Delete associated blocking preferences by saving an empty array
  await BlockingPreferenceApi.saveWorkflowBlockingPreferences(id, [])
}

// Update last selected timestamp
const updateLastSelected = async (id: string): Promise<void> => {
  await WorkflowRepo.updateLastSelected(id)
}

export const WorkflowApi = {
  getWorkflows,
  getWorkflowById,
  saveWorkflow,
  deleteWorkflow,
  updateLastSelected
} 
