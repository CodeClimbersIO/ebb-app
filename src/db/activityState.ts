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

export const getActivityStatesBetween = async (start: string, end: string) => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const query = `SELECT * FROM activity_state WHERE start_time >= '${start}' AND end_time <= '${end}';`
  const activityStates = await monitorDb.select<ActivityState[]>(query)
  return activityStates
}

export const ActivityStateDb = {
  getActivityStatesBetween,
}
