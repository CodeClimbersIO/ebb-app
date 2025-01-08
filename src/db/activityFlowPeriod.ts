import { MonitorDb } from './monitorDb'

export interface ActivityFlowPeriod {
  id: number
  start_time: string
  end_time: string
  score: number
  app_switches: number
  inactive_time: number
  created_at: string
}

const getActivityFlowPeriodsBetween = async (start: string, end: string) => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const activityFlowPeriods = await monitorDb.select<ActivityFlowPeriod[]>(
    `SELECT * FROM activity_flow_period WHERE start_time >= '${start}' AND end_time <= '${end}';`,
  )
  return activityFlowPeriods
}

export const ActivityFlowPeriodDb = {
  getActivityFlowPeriodsBetween,
}
