import { QueryResult } from '@tauri-apps/plugin-sql'
import { insert, update } from '../lib/sql.util'
import { getEbbDb } from './ebbDb'

export interface FlowSessionDb {
  id: string
  start: string
  end?: string
  objective: string
  self_score?: number
  stats?: string
  flow_periods?: string
}

export type FlowSession = FlowSessionDb & {
}


const createFlowSession = async (
  flowSession: FlowSessionDb,
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
  const query = `SELECT 
      fs.*,
      CASE
      WHEN MAX(fp.id) IS NULL THEN NULL
      ELSE json_group_array(
              json_object(
                      'start_time', fp.start_time,
                      'end_time', fp.end_time,
                      'score', fp.score,
                      'details', fp.details
              )
            )
      END as flow_periods
    FROM flow_session fs
      LEFT JOIN flow_period fp ON fs.start <= fp.start_time AND fs.end >= fp.end_time
    GROUP BY fs.id, fs.objective, fs.self_score, fs.start, fs.end
    ORDER BY start DESC LIMIT ${limit};`
  const flowSessions = await ebbDb.select<FlowSessionDb[]>(query) 

  return flowSessions.map((flowSession) => ({
    ...flowSession,
    flow_periods_json: flowSession.flow_periods ? JSON.parse(flowSession.flow_periods) : [],
    stats_json: flowSession.stats ? JSON.parse(flowSession.stats) : {},
  }))
}

const getFlowSessionById = async (id: string): Promise<FlowSession | undefined> => {
  const ebbDb = await getEbbDb()
  const [flowSession] = await ebbDb.select<FlowSession[]>(
    `SELECT 
      fs.*,
      CASE
      WHEN MAX(fp.id) IS NULL THEN NULL
      ELSE json_group_array(
              json_object(
                      'start_time', fp.start_time,
                      'end_time', fp.end_time,
                      'score', fp.score,
                      'details', fp.details
              )
            )
      END as flow_periods
    FROM flow_session fs 
    LEFT JOIN flow_period fp ON fs.start <= fp.start_time AND fs.end >= fp.end_time
    WHERE fs.id = ${id}
    GROUP BY fs.id, fs.objective, fs.self_score, fs.start, fs.end;`,
  )
  return flowSession
}

const getInProgressFlowSession = async () => {
  const ebbDb = await getEbbDb()
  const [flowSession] = await ebbDb.select<FlowSession[]>(
    `SELECT 
      fs.*,
      CASE
      WHEN MAX(fp.id) IS NULL THEN NULL
      ELSE json_group_array(
              json_object(
                      'start_time', fp.start_time,
                      'end_time', fp.end_time,
                      'score', fp.score,
                      'details', fp.details
              )
            )
      END as flow_periods
    FROM flow_session fs
    LEFT JOIN flow_period fp ON fs.start <= fp.start_time
    WHERE fs.end IS NULL
    GROUP BY fs.id, fs.objective, fs.self_score, fs.start, fs.end
    LIMIT 1;`,
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
