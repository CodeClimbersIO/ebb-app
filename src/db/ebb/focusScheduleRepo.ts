import { QueryResult } from '@tauri-apps/plugin-sql'
import { insert, update } from '@/lib/utils/sql.util'
import { getEbbDb } from './ebbDb'

export interface FocusScheduleSchema {
  id: string
  label?: string
  scheduled_time: string // ISO datetime string
  workflow_id: string
  recurrence_settings?: string // JSON stringified RecurrenceSettings
  is_active: number // Boolean as integer (0/1)
  created_at: string
  updated_at: string
}

export interface RecurrenceSettings {
  type: 'none' | 'daily' | 'weekly'
  daysOfWeek?: number[] // [0,1,2,3,4,5,6] where 0=Sunday
}

export type FocusSchedule = FocusScheduleSchema & {
  recurrence?: RecurrenceSettings
}

export type CreateFocusSchedule = Omit<FocusScheduleSchema, 'created_at' | 'updated_at'>

const createFocusSchedule = async (
  focusSchedule: CreateFocusSchedule,
): Promise<QueryResult> => {
  const ebbDb = await getEbbDb()
  const focusScheduleWithId = {
    ...focusSchedule,
    id: self.crypto.randomUUID(),
  }
  return insert(ebbDb, 'focus_schedule', focusScheduleWithId)
}

const updateFocusSchedule = async (
  id: string,
  focusSchedule: Partial<CreateFocusSchedule>,
): Promise<QueryResult> => {
  const ebbDb = await getEbbDb()
  return update(ebbDb, 'focus_schedule', focusSchedule, id)
}

const getFocusSchedules = async (): Promise<FocusSchedule[]> => {
  const ebbDb = await getEbbDb()
  const result = await ebbDb.select<FocusScheduleSchema[]>(
    'SELECT * FROM focus_schedule WHERE is_active = 1 ORDER BY scheduled_time ASC'
  )
  
  return result.map(schedule => ({
    ...schedule,
    recurrence: schedule.recurrence_settings ? JSON.parse(schedule.recurrence_settings) : undefined
  }))
}

const getFocusScheduleById = async (id: string): Promise<FocusSchedule | undefined> => {
  const ebbDb = await getEbbDb()
  const result = await ebbDb.select<FocusScheduleSchema[]>(
    'SELECT * FROM focus_schedule WHERE id = ? AND is_active = 1',
    [id]
  )
  
  if (result.length === 0) return undefined
  
  const schedule = result[0]
  return {
    ...schedule,
    recurrence: schedule.recurrence_settings ? JSON.parse(schedule.recurrence_settings) : undefined
  }
}

const deleteFocusSchedule = async (id: string): Promise<QueryResult> => {
  const ebbDb = await getEbbDb()
  const result = await update(ebbDb, 'focus_schedule', { is_active: 0 }, id)
  return result
}

const getFocusSchedulesWithWorkflow = async (): Promise<(FocusSchedule & { workflow_name?: string })[]> => {
  const ebbDb = await getEbbDb()
  const result = await ebbDb.select<(FocusScheduleSchema & { workflow_name?: string })[]>(
    `SELECT 
      fs.*,
      w.name as workflow_name
    FROM focus_schedule fs
    LEFT JOIN workflow w ON fs.workflow_id = w.id
    WHERE fs.is_active = 1 
    ORDER BY fs.scheduled_time ASC`
  )
  
  return result.map(schedule => ({
    ...schedule,
    recurrence: schedule.recurrence_settings ? JSON.parse(schedule.recurrence_settings) : undefined
  }))
}

export const FocusScheduleRepo = {
  createFocusSchedule,
  updateFocusSchedule,
  getFocusSchedules,
  getFocusScheduleById,
  deleteFocusSchedule,
  getFocusSchedulesWithWorkflow,
}
