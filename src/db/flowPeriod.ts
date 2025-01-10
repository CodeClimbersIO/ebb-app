import { QueryResult } from '@tauri-apps/plugin-sql'
import { insert } from '../lib/sql.util'
import { getEbbDb } from './ebbDb'
import { DateTime } from 'luxon'

export interface FlowPeriod {
  id?: number
  start_time: string
  end_time: string
  score: number
  details: string // JSON string
  created_at: string
}

const getFlowPeriodsBetween = async (start: DateTime, end: DateTime) => {
  const ebbDb = await getEbbDb()
  const flowPeriods = await ebbDb.select<FlowPeriod[]>(
    `SELECT * FROM flow_period WHERE start_time >= '${start.toUTC().toISO()}' AND end_time <= '${end.toUTC().toISO()}';`,
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
