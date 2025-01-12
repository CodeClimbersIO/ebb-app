import { QueryResult } from '@tauri-apps/plugin-sql'
import { insert, update } from '../lib/sql.util'
import { getEbbDb } from './ebbDb'
import { ActivityState } from './activityState'
import { FlowPeriod } from './flowPeriod'

export interface FlowSession {
  id: string
  start: string
  end?: string
  objective: string
  self_score?: number
}


export type FlowSessionWithStats = FlowSession & {
  score: number
  timeInFlow: number
  activityStates: ActivityState[]
  activityFlowPeriods: FlowPeriod[]
  inactiveTime: number
  activeTime: number
}

const createFlowSession = async (
  flowSession: FlowSession,
): Promise<QueryResult> => {
  const ebbDb = await getEbbDb()
  return insert(ebbDb, 'flow_session', flowSession)
}

const updateFlowSession = async (
  flowSession: Partial<FlowSession> & { id: string },
): Promise<QueryResult> => {
  const ebbDb = await getEbbDb()
  return update(ebbDb, 'flow_session', flowSession, flowSession.id)
}

const getFlowSessions = async (limit = 10): Promise<FlowSession[]> => {
  const ebbDb = await getEbbDb()
  const flowSessions = await ebbDb.select<FlowSession[]>(
    `SELECT * FROM flow_session ORDER BY start DESC LIMIT ${limit};`,
  )
  return flowSessions
}

const getFlowSessionById = async (id: string) => {
  const ebbDb = await getEbbDb()
  const flowSession = await ebbDb.select(
    `SELECT * FROM flow_session WHERE id = ${id};`,
  )
  return flowSession
}

const getInProgressFlowSession = async () => {
  const ebbDb = await getEbbDb()
  const [flowSession] = await ebbDb.select<FlowSession[]>(
    'SELECT * FROM flow_session WHERE end IS NULL LIMIT 1;',
  )
  return flowSession
}

export const FlowSessionDb = {
  createFlowSession,
  updateFlowSession,
  getFlowSessions,
  getFlowSessionById,
  getInProgressFlowSession,
}
