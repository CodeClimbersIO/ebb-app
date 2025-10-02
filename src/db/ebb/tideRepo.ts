import { QueryResult } from '@tauri-apps/plugin-sql'
import { update } from '@/lib/utils/sql.util'
import { getEbbDb } from './ebbDb'

export interface TideSchema {
  id: string
  start: string // ISO string
  end?: string // ISO string, nullable for indefinite tides
  completed_at?: string // ISO string, when the tide was actually completed
  metrics_type: string // "creating", etc.
  tide_frequency: string // "daily", "weekly", "monthly", "indefinite"
  goal_amount: number // Goal in minutes
  actual_amount: number // Current progress in minutes
  tide_template_id: string
  created_at: string // ISO string
  updated_at: string // ISO string
}

export interface TideTemplateSchema {
  id: string
  metrics_type: string // "creating", etc.
  tide_frequency: string // "daily", "weekly", "monthly", "indefinite"
  first_tide: string // ISO string - How far back to create tides when generating
  day_of_week?: string // For daily tides: comma-separated days "0,1,2,3,4,5,6"
  goal_amount: number // Goal in minutes
  created_at: string // ISO string
  updated_at: string // ISO string
}

export type Tide = TideSchema
export type TideTemplate = TideTemplateSchema

export type TideWithTemplate = Tide & {
  template?: TideTemplate
}

// Tide Repository Functions

const updateTide = async (
  id: string,
  tide: Partial<TideSchema>,
): Promise<QueryResult> => {
  const ebbDb = await getEbbDb()
  return update(ebbDb, 'tide', tide, id)
}

const getActiveTides = async (): Promise<Tide[]> => {
  const ebbDb = await getEbbDb()
  const now = new Date().toISOString()

  // Get tides that are not completed and are within their time window
  const query = `
    SELECT * FROM tide
    WHERE completed_at IS NULL
    AND (end IS NULL OR end > ?)
    ORDER BY start DESC
  `

  return await ebbDb.select<Tide[]>(query, [now])
}

const getActiveTidesForPeriod = async (evaluationTime: string): Promise<Tide[]> => {
  const ebbDb = await getEbbDb()

  const query = `
    SELECT * FROM tide
    WHERE datetime(start) <= datetime(?)
    AND (end IS NULL OR datetime(end) > datetime(?))
    ORDER BY start DESC
  `
  const tides = await ebbDb.select<Tide[]>(query, [evaluationTime, evaluationTime])
  return tides
}

// Tide Template Repository Functions

const updateTideTemplate = async (
  id: string,
  template: Partial<TideTemplateSchema>,
): Promise<QueryResult> => {
  const ebbDb = await getEbbDb()
  return update(ebbDb, 'tide_template', template, id)
}

const getAllTideTemplates = async (): Promise<TideTemplate[]> => {
  const ebbDb = await getEbbDb()
  return await ebbDb.select<TideTemplate[]>(
    'SELECT * FROM tide_template ORDER BY created_at DESC'
  )
}

export const TideRepo = {
  // Tide operations
  updateTide,
  getActiveTides,
  getActiveTidesForPeriod,

  // Tide template operations
  updateTideTemplate,
  getAllTideTemplates,
}
