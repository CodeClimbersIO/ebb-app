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
  activities?: string
}

export type ActivityState = ActivityStateDb & {
  activities_json: Activity[]
}

export const getActivityStatesBetween = async (start: DateTime, end: DateTime): Promise<ActivityStateDb[]> => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const startUtc = start.toUTC().toISO()
  const endUtc = end.toUTC().toISO()
  const query = `
    SELECT 
      acts.*,
      CASE
      WHEN MAX(act.id) IS NULL THEN NULL
      ELSE json_group_array(
              json_object(
                      'activity_type', act.activity_type,
                      'app_name', act.app_name,
                      'app_window_title', act.app_window_title,
                      'created_at', act.created_at,
                      'timestamp', act.timestamp
              )
            )
      END as activities
    FROM activity_state acts
    LEFT JOIN activity act ON acts.start_time <= act.timestamp AND acts.end_time >= act.timestamp
    WHERE acts.start_time >= '${startUtc}' AND acts.end_time <= '${endUtc}';`
  const activityStates = await monitorDb.select<ActivityStateDb[]>(query)
  return activityStates
}

export const ActivityStateDb = {
  getActivityStatesBetween,
}
