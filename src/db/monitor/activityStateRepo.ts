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
  app_window_title: string
  created_at: string
  timestamp: string
  bundle_id: string
} 

export interface App {
  id: string
  app_name: string
  tags: AppTag[]
  external_id: string
  is_browser: boolean
}
export interface AppTag {
  id: string
  app_id: string
  tag_id: string
  weight: number
  tag_name: string
  tag_type: 'default' | 'category'
}

export interface ActivityStateDb {
  id: number
  state: ActivityStateType
  app_switches: number
  start_time: string
  end_time: string
  created_at: string
  tags?: string
  apps?: string
}

export type ActivityState = ActivityStateDb & {
  tags_json?: {
    tag_id: string
    name: string
  }[]
  apps_json?: App[]
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

export const getActivityStatesWithApps = async (start: DateTime, end: DateTime): Promise<ActivityStateDb[]> => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const startUtc = start.toUTC().toISO()
  const endUtc = end.toUTC().toISO()
  const query = `
    SELECT
      as_main.id,
      as_main.state,
      as_main.start_time,
      as_main.end_time,
      CASE
        WHEN MAX(a.id) IS NULL THEN NULL
        ELSE json_group_array(DISTINCT
          json_object(
            'id', app.id,
            'app_name', app.name,
            'external_id', app.app_external_id,
            'is_browser', app.is_browser,
            'tags', (
              SELECT json_group_array(
                json_object(
                  'id', at.id,
                  'app_id', at.app_id,
                  'tag_id', at.tag_id,
                  'weight', at.weight,
                  'tag_type', t.tag_type,
                  'tag_name', t.name
                )
              )
              FROM app_tag at
              LEFT JOIN tag t ON at.tag_id = t.id
              WHERE at.app_id = app.id
            )
          )
        )
        END as apps
    FROM activity_state as_main
      LEFT JOIN activity a ON a.timestamp BETWEEN as_main.start_time AND as_main.end_time
      LEFT JOIN app ON app.id = a.app_id
    WHERE as_main.start_time >= '${startUtc}' AND as_main.end_time <= '${endUtc}'
    GROUP BY as_main.id, as_main.state, as_main.start_time, as_main.end_time
    ORDER BY as_main.id DESC
    `
  const activityStates = await monitorDb.select<ActivityStateDb[]>(query)
  return activityStates
}


export const ActivityStateRepo = {
  getActivityStatesByTagsAndTimePeriod,
  getActivityStatesWithApps,
}
