import { DateTime } from 'luxon'
import { MonitorDb } from './monitorDb'

export enum ActivityStateType {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
}

export interface ActivityState {
  id: number
  state: ActivityStateType
  app_switches: number
  start_time: string
  end_time: string
  created_at: string
}

export const getActivityStatesBetween = async (start: DateTime, end: DateTime) => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const query = `SELECT * FROM activity_state WHERE start_time >= '${start.toUTC().toISO()}' AND end_time <= '${end.toUTC().toISO()}';`
  console.log(query)
  const activityStates = await monitorDb.select<ActivityState[]>(query)
  return activityStates
}

export const ActivityStateDb = {
  getActivityStatesBetween,
}
