import { DateTime } from 'luxon'
import { MonitorDb } from './monitorDb'

export enum ActivityStateType {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
}

export enum ActivityType {
  Window = 'WINDOW',
  Mouse = 'MOUSE',
  Keyboard = 'KEYBOARD',
}

export interface Activity {
  activity_type: ActivityType
  app_name: string
  app_window_title: string
  created_at: string
  timestamp: string
}

export interface ActivityStateDb {
  id: number
  state: ActivityStateType
  app_switches: number
  start_time: string
  end_time: string
  created_at: string
  tags?: string
}

export type ActivityState = ActivityStateDb & {
  tags_json?: {
    tag_id: string
    name: string
  }[]
}

export const getActivityStatesByTagsAndTimePeriod = async (tagIds: string[], start: DateTime, end: DateTime): Promise<ActivityStateDb[]> => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const startUtc = start.toUTC().toISO()
  const endUtc = end.toUTC().toISO()
  const query = `
    SELECT 
    acts.*,
    json_group_array(json_object(
      'tag_id', t.id,
      'name', t.name
    )) as tags
    FROM activity_state acts
      LEFT JOIN activity_state_tag ast ON ast.activity_state_id = acts.id
      LEFT JOIN tag t ON ast.tag_id = t.id
    WHERE acts.start_time >= '${startUtc}' AND acts.end_time <= '${endUtc}' AND ast.tag_id IN ('${tagIds.join('\',\'')}')
    GROUP BY acts.id, acts.state, acts.app_switches, acts.start_time, acts.end_time, acts.created_at`
  const activityStates = await monitorDb.select<ActivityStateDb[]>(query)
  return activityStates
}

export const ActivityStateRepo = {
  getActivityStatesByTagsAndTimePeriod,
}
