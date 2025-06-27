import { QueryResult } from '@tauri-apps/plugin-sql'
import { FlowSession, FlowSessionRepo, FlowSessionSchema } from '@/db/ebb/flowSessionRepo'
import { Workflow, WorkflowApi } from './workflowApi'


const startFlowSession = async (
  objective: string, 
  type: 'smart' | 'manual',
  workflow?: Workflow | null,
): Promise<string> => {
  const inProgressFlowSession = await FlowSessionRepo.getInProgressFlowSession()
  
  if (inProgressFlowSession) throw new Error('Flow session already in progress')

  let workflowToUse = workflow
  if (!workflow) {
    workflowToUse = await WorkflowApi.getSmartDefaultWorkflow()
  }
  if (!workflowToUse) throw new Error('No workflow found')

  const flowSession: FlowSessionSchema = {
    id: self.crypto.randomUUID(),
    start: new Date().toISOString(),
    workflow_id: workflowToUse.id,
    objective: objective || workflowToUse.name,
    self_score: 0,
    duration: workflowToUse.settings.defaultDuration ? workflowToUse.settings.defaultDuration * 60 : undefined,
    type
  }
  
  await FlowSessionRepo.createFlowSession(flowSession)
  window.dispatchEvent(new CustomEvent('flow-session-started', { detail: { id: flowSession.id } }))

  return flowSession.id
}

const endFlowSession = async (): Promise<QueryResult> => {
  const flowSession = await FlowSessionRepo.getInProgressFlowSession()
  if (!flowSession) {
    throw new Error('Flow session not found')
  }

  const flowSessionUpdated: Partial<FlowSessionSchema> = {
    end: new Date().toISOString(),
  }
  console.log('flowSessionUpdated', flowSessionUpdated)

  return FlowSessionRepo.updateFlowSession(flowSession.id, flowSessionUpdated)
}

const scoreFlowSession = async (
  id: string,
  score: number,
): Promise<QueryResult> => {
  const flowSession: Partial<FlowSessionSchema> = {
    self_score: score,
  }
  return FlowSessionRepo.updateFlowSession(id, flowSession)
}

const getInProgressFlowSession = async () => {
  return FlowSessionRepo.getInProgressFlowSession()
}

const getFlowSessions = async (limit = 10): Promise<FlowSession[]> => {
  const flowSessions = await FlowSessionRepo.getFlowSessions(limit)
  return flowSessions
}

const updateFlowSessionDuration = async (id: string, newDuration: number): Promise<QueryResult> => {
  const flowSession: Partial<FlowSessionSchema> = {
    duration: newDuration,
  }
  return FlowSessionRepo.updateFlowSession(id, flowSession)
}

const getMostRecentFlowSession = async () => {
  return FlowSessionRepo.getMostRecentFlowSession()
}

export const FlowSessionApi = {
  startFlowSession,
  endFlowSession,
  scoreFlowSession,
  getInProgressFlowSession,
  getFlowSessions,
  updateFlowSessionDuration,
  getMostRecentFlowSession,
}
