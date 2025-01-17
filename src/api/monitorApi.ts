import { FlowPeriod, FlowPeriodDb } from '../db/flowPeriod'
import { ActivityState, ActivityStateDb } from '../db/activityState'
import { MonitorDb } from '../db/monitorDb'
import { DateTime } from 'luxon'

const getActivities = async () => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const activities = await monitorDb.select('SELECT * FROM activity LIMIT 10;')
  return activities
}

const getActivityAndFlowPeriodsBetween = async (start: DateTime, end: DateTime): Promise<{activityStates: ActivityState[], activityFlowPeriods: FlowPeriod[]}> => {
  console.log('Between')
  console.log('start', start)
  console.log('end', end)
  const activityStates = await getActivityStatesBetween(
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

const getActivityStatesBetween = async (start: DateTime, end: DateTime): Promise<ActivityState[]> => {
  const activityStates = await ActivityStateDb.getActivityStatesBetween(start, end)
  return activityStates.map((activityState) => ({
    ...activityState,
    activities_json: activityState.activities ? JSON.parse(activityState.activities) : [],
  }))
}

export const MonitorApi = {
  getActivities,
  getActivityAndFlowPeriodsBetween,
  getActivityStatesBetween,
}
