import { FlowPeriodDb } from '../db/flowPeriod'
import { ActivityStateDb } from '../db/activityState'
import { MonitorDb } from '../db/monitorDb'
import { DateTime } from 'luxon'

const getActivities = async () => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const activities = await monitorDb.select('SELECT * FROM activity LIMIT 10;')
  return activities
}

const getActivityAndFlowPeriodsBetween = async (start: DateTime, end: DateTime) => {
  console.log('Between')
  console.log('start', start)
  console.log('end', end)
  const activityStates = await ActivityStateDb.getActivityStatesBetween(
    start,
    end,
  )
  const activityFlowPeriods =
    await FlowPeriodDb.getFlowPeriodsBetween(start, end)
  return {
    activityStates,
    activityFlowPeriods,
  }
}

export const MonitorApi = {
  getActivities,
  getActivityAndFlowPeriodsBetween,
}
