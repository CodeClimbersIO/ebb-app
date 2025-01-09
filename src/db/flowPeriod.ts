import { QueryResult } from '@tauri-apps/plugin-sql'
import { insert } from '../lib/sql.util'
import { getEbbDb } from './ebbDb'

export interface FlowPeriod {
  id: number
  start_time: string
  end_time: string
  score: number
  app_switches: number
  active_time: number
  created_at: string
}

const getFlowPeriodsBetween = async (start: string, end: string) => {
  const ebbDb = await getEbbDb()
  const flowPeriods = await ebbDb.select<FlowPeriod[]>(
    `SELECT * FROM flow_period WHERE start_time >= '${start}' AND end_time <= '${end}';`,
  )
  return flowPeriods
}

export const getLastFlowPeriod = async (): Promise<FlowPeriod | undefined> => {
  const ebbDb = await getEbbDb()
  const query = 'SELECT * FROM flow_period ORDER BY id DESC LIMIT 1;'
  const [flowPeriod] = await ebbDb.select<FlowPeriod[]>(query)
  return flowPeriod
}

const createFlowPeriod = async (period: FlowPeriod): Promise<QueryResult> => {
  const ebbDb = await getEbbDb()
  return insert(ebbDb, 'flow_period', period)
}

export const FlowPeriodDb = {
  getFlowPeriodsBetween,
  getLastFlowPeriod,
  createFlowPeriod,
}
