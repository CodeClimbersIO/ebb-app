import { QueryResult } from '@tauri-apps/plugin-sql'
import { insert, update } from '@/lib/utils/sql.util'
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

const createTide = async (tide: TideSchema): Promise<QueryResult> => {
  const ebbDb = await getEbbDb()
  return insert(ebbDb, 'tide', tide)
}

const updateTide = async (
  id: string,
  tide: Partial<TideSchema>,
): Promise<QueryResult> => {
  const ebbDb = await getEbbDb()
  return update(ebbDb, 'tide', tide, id)
}

const getTideById = async (id: string): Promise<Tide | undefined> => {
  const ebbDb = await getEbbDb()
  const [tide] = await ebbDb.select<Tide[]>(
    'SELECT * FROM tide WHERE id = ?',
    [id]
  )
  return tide
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

  // Get tides that overlap with the evaluation time
  const query = `
    SELECT * FROM tide
    WHERE start <= ?
    AND (end IS NULL OR end > ?)
    ORDER BY start DESC
  `

  return await ebbDb.select<Tide[]>(query, [evaluationTime, evaluationTime])
}

const getTidesByFrequency = async (frequency: string): Promise<Tide[]> => {
  const ebbDb = await getEbbDb()

  const query = `
    SELECT * FROM tide
    WHERE tide_frequency = ?
    ORDER BY start DESC
  `

  return await ebbDb.select<Tide[]>(query, [frequency])
}

const getRecentTides = async (limit = 10): Promise<Tide[]> => {
  const ebbDb = await getEbbDb()

  const query = `
    SELECT * FROM tide
    ORDER BY start DESC
    LIMIT ?
  `

  return await ebbDb.select<Tide[]>(query, [limit])
}

const completeTide = async (id: string): Promise<QueryResult> => {
  const ebbDb = await getEbbDb()
  const completedAt = new Date().toISOString()
  const updatedAt = new Date().toISOString()

  return update(ebbDb, 'tide', {
    completed_at: completedAt,
    updated_at: updatedAt
  }, id)
}

const updateTideProgress = async (id: string, actualAmount: number): Promise<QueryResult> => {
  const ebbDb = await getEbbDb()
  const updatedAt = new Date().toISOString()

  return update(ebbDb, 'tide', {
    actual_amount: actualAmount,
    updated_at: updatedAt
  }, id)
}

// Tide Template Repository Functions

const createTideTemplate = async (template: TideTemplateSchema): Promise<QueryResult> => {
  const ebbDb = await getEbbDb()
  return insert(ebbDb, 'tide_template', template)
}

const updateTideTemplate = async (
  id: string,
  template: Partial<TideTemplateSchema>,
): Promise<QueryResult> => {
  const ebbDb = await getEbbDb()
  return update(ebbDb, 'tide_template', template, id)
}

const getTideTemplateById = async (id: string): Promise<TideTemplate | undefined> => {
  const ebbDb = await getEbbDb()
  const [template] = await ebbDb.select<TideTemplate[]>(
    'SELECT * FROM tide_template WHERE id = ?',
    [id]
  )
  return template
}

const getAllTideTemplates = async (): Promise<TideTemplate[]> => {
  const ebbDb = await getEbbDb()
  return await ebbDb.select<TideTemplate[]>(
    'SELECT * FROM tide_template ORDER BY created_at DESC'
  )
}

const getTideTemplatesByFrequency = async (frequency: string): Promise<TideTemplate[]> => {
  const ebbDb = await getEbbDb()
  return await ebbDb.select<TideTemplate[]>(
    'SELECT * FROM tide_template WHERE tide_frequency = ? ORDER BY created_at DESC',
    [frequency]
  )
}

// Combined queries

const getTidesWithTemplates = async (limit = 10): Promise<TideWithTemplate[]> => {
  const ebbDb = await getEbbDb()

  const query = `
    SELECT
      t.*,
      json_object(
        'id', tt.id,
        'metrics_type', tt.metrics_type,
        'tide_frequency', tt.tide_frequency,
        'first_tide', tt.first_tide,
        'day_of_week', tt.day_of_week,
        'goal_amount', tt.goal_amount,
        'created_at', tt.created_at,
        'updated_at', tt.updated_at
      ) as template
    FROM tide t
    LEFT JOIN tide_template tt ON t.tide_template_id = tt.id
    ORDER BY t.start DESC
    LIMIT ?
  `

  return await ebbDb.select<TideWithTemplate[]>(query, [limit])
}

export const TideRepo = {
  // Tide operations
  createTide,
  updateTide,
  getTideById,
  getActiveTides,
  getActiveTidesForPeriod,
  getTidesByFrequency,
  getRecentTides,
  completeTide,
  updateTideProgress,

  // Tide template operations
  createTideTemplate,
  updateTideTemplate,
  getTideTemplateById,
  getAllTideTemplates,
  getTideTemplatesByFrequency,

  // Combined operations
  getTidesWithTemplates,
}
