import { ActivityFlowPeriodDb } from '../db/activityFlowPeriod'
import { ActivityStateDb } from '../db/activityState'
import { MonitorDb } from '../db/monitorDb'

const getActivities = async () => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const activities = await monitorDb.select('SELECT * FROM activity LIMIT 10;')
  return activities
}

const getActivityAndFlowPeriodsBetween = async (start: string, end: string) => {
  console.log('Between')
  console.log('start', start)
  console.log('end', end)
  const activityStates = await ActivityStateDb.getActivityStatesBetween(
    start,
    end,
  )
  const activityFlowPeriods =
    await ActivityFlowPeriodDb.getActivityFlowPeriodsBetween(start, end)
  return {
    activityStates,
    activityFlowPeriods,
  }
}

export const MonitorApi = {
  getActivities,
  getActivityAndFlowPeriodsBetween,
}
