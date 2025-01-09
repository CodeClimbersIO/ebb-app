import { QueryResult } from '@tauri-apps/plugin-sql'
import { ActivityState, ActivityStateDb, ActivityStateType } from '../../db/activityState'
import { FlowPeriod, FlowPeriodDb } from '../../db/flowPeriod'
import { DateTime } from 'luxon'
import assert from 'assert'

interface Period {
  start: DateTime
  end: DateTime
}

interface FlowPeriodScore {
  activityScore: {
    score: number
    detail: number
  }
  appSwitchScore: {
    score: number
    detail: number
  }
  flowStreakScore: {
    score: number
    detail: number
  }
  totalScore: number
}

/**
 * Activity score is the number of active states, capped at 5. 
 * Each active state is 30 seconds in the 10 minute period.
 * For each minute after 2 minutes, add 1 point.
 */
const getActivityScoreForActivityStates = (
  activityStates: ActivityState[]
): [number, number] => {
  const activeStates = activityStates.filter(
    state => state.state === ActivityStateType.Active
  ).length
  
  const activityScore = Math.min((activeStates - 4) / 2, 5)
  return [Math.max(activityScore, 0), activeStates]
}

const getAppSwitchScoreForActivityStates = (
  activityStates: ActivityState[]
): [number, number] => {
  if (activityStates.length === 0) {
    return [0.0, 0.0]
  }

  const appSwitchAvg = activityStates.reduce((sum, state) => sum + state.app_switches, 0) / activityStates.length

  if (appSwitchAvg <= 4.0) {
    return [1.0, appSwitchAvg]
  } else if (appSwitchAvg <= 8.0) {
    return [0.5, appSwitchAvg]
  } else {
    return [0.0, appSwitchAvg]
  }
}

const getFlowStreakScoreForPeriod = (flowPeriods: FlowPeriod[]): [number,number] => {
  let streak = 0
  for (const flowPeriod of flowPeriods) {
    if (flowPeriod.score > 5) {
      streak += 1
    } else {
      break
    }
  }
  const score = Math.min(streak, 4)
  return [score, streak]
}


const getFlowPeriodScore = (activityStates: ActivityState[], flowPeriods: FlowPeriod[]): FlowPeriodScore => {
  const [activityScore, activityDetail] = getActivityScoreForActivityStates(activityStates)
  const [appSwitchScore, appSwitchDetail] = getAppSwitchScoreForActivityStates(activityStates)
  const [flowStreakScore, flowStreakDetail] = getFlowStreakScoreForPeriod(flowPeriods)
  return {
    activityScore: {
      score: activityScore,
      detail: activityDetail
    },
    appSwitchScore: {
      score: appSwitchScore,
      detail: appSwitchDetail
    },
    flowStreakScore: {
      score: flowStreakScore,
      detail: flowStreakDetail
    },
    totalScore: activityScore + appSwitchScore + flowStreakScore
  }
}

/**
 * Takes the last flow period and returns the next activity flow period. 
 * If the last flow period is within 5 seconds of now, it will start from the last flow period end time.
 * This allows for an exact match to the last flow period. If the last flow period is not within 5 seconds of now, it will start from now, which will create a gap between the last flow period and the new flow period.
 * If no interval is found, create a period as though the last flow period ended now.
 */
const getNextFlowPeriod = async (lastFlowPeriod: FlowPeriod | undefined, intervalMs: number): Promise<Period> => {
  try {
    const now = DateTime.now()

    if (!lastFlowPeriod) {
      return {
        start: now,
        end: now.plus({ milliseconds: intervalMs })
      }
    }

    const lastEndTime = DateTime.fromISO(lastFlowPeriod.end_time)
    let startTime = lastEndTime
    if(lastEndTime.plus({ milliseconds: 5000 }).toMillis() < now.toMillis()) {
      startTime = now
    }

    return {
      start: startTime,
      end: startTime.plus({ milliseconds: intervalMs })
    }
  } catch (error) {
    console.error('Error getting next activity flow period:', error)
    throw error
  }
}

const getFlowPeriodScoreForPeriod = async (period: Period): Promise<FlowPeriodScore> => {
  const start = period.start.toISO()
  const end = period.end.toISO()
  assert(start && end, 'Start and end for period must be defined')

  console.log('Getting activity states between', start, end)
  const activityStates = await ActivityStateDb.getActivityStatesBetween(start, end)
  console.log('Getting flow periods between', start, end)
  const flowPeriods = await FlowPeriodDb.getFlowPeriodsBetween(start, end)
  const flowPeriodScore = getFlowPeriodScore(activityStates, flowPeriods)

  return flowPeriodScore
}

const createFlowPeriod = async (period: FlowPeriod): Promise<QueryResult> => {
  return FlowPeriodDb.createFlowPeriod(period)
}

let isJobRunning = false
const TEN_MINUTES = 10 * 60 * 1000

// every 10 minutes, calculate the flow period score for the last 10 minutes
const startFlowPeriodScoreJob = async (intervalMs = TEN_MINUTES): Promise<void> => {
  if (isJobRunning) {
    return
  }
  isJobRunning = true
  console.log('Starting flow period score job')
  setInterval(async () => {
    console.log('Calculating flow period score')
    const lastFlowPeriod = await FlowPeriodDb.getLastFlowPeriod()
    const period = await getNextFlowPeriod(lastFlowPeriod, intervalMs)
    const flowPeriodScore = await getFlowPeriodScoreForPeriod(period)
    console.log('Flow period score', flowPeriodScore)
  }, intervalMs)
}



export const FlowPeriodApi = {
  getActivityScoreForActivityStates,
  getAppSwitchScoreForActivityStates,
  getFlowStreakScoreForPeriod,
  getFlowPeriodScore,
  getFlowPeriodScoreForPeriod,
  getNextFlowPeriod,
  createFlowPeriod,
  startFlowPeriodScoreJob,

}


