import { QueryResult } from '@tauri-apps/plugin-sql'
import { ActivityState, ActivityStateDb, ActivityStateType } from '../../db/activityState'
import { FlowPeriod, FlowPeriodDb } from '../../db/flowPeriod'
import { DateTime } from 'luxon'

const SHOULD_SAVE_FLOW_PERIOD = true
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
  const appSwitchTotal = activityStates.reduce((sum, state) => sum + state.app_switches, 0)
  const appSwitchAvg = appSwitchTotal / activityStates.length

  if (appSwitchAvg <= 4.0) {
    return [1.0, appSwitchTotal]
  } else if (appSwitchAvg <= 8.0) {
    return [0.5, appSwitchTotal]
  } else {
    return [0.0, appSwitchTotal]
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
 * If the last flow period is not within 2 seconds of now, it will start from now, which will create a gap between the last flow period and the new flow period.
 * This allows for an exact match to the last flow period.
 * If no interval is found, create a period as though the last flow period ended now.
 * |  A |  B   |  C  | This is the effect we are trying to achieve. That there is some elasticity in the flow period to connecting the last flow period to the new flow period. The elasticity accounts for variance in program execution
 * |  A  |      |  B  | We will do this if outside of +/- 2 seconds of the last flow period end time.
 */
const getNextFlowPeriod = async (lastFlowPeriod: FlowPeriod | undefined, intervalMs: number): Promise<Period> => {
  try {
    const now = DateTime.now()
    const defaultStart = now.minus({ milliseconds: intervalMs })
    const defaultEnd = now

    if (!lastFlowPeriod) { // |  A  |
      return {
        start: defaultStart,
        end: defaultEnd
      }
    }


    if (now.minus({ milliseconds: intervalMs}) >= DateTime.fromISO(lastFlowPeriod.end_time).plus({ seconds: 2})) {
      return {  // |  A  |     |  B  |
        start: defaultStart,
        end: defaultEnd
      }
    }

    const lastEndTime = DateTime.fromISO(lastFlowPeriod.end_time)
    return { // |  A |  B  |
      start: lastEndTime,
      end: lastEndTime.plus({ milliseconds: intervalMs })
    }
  } catch (error) {
    console.error('Error getting next activity flow period:', error)
    throw error
  }
}

const getFlowPeriodScoreForPeriod = async (period: Period): Promise<FlowPeriodScore> => {
  if(!period.start.toISO() || !period.end.toISO()) {
    throw new Error('Start and end for period must be defined')
  }

  console.log('Getting activity states between', period.start, period.end)
  const activityStates = await ActivityStateDb.getActivityStatesBetween(period.start, period.end)
  console.log('Getting flow periods between', period.start, period.end)
  const flowPeriods = await FlowPeriodDb.getFlowPeriodsBetween(period.start, period.end)
  console.log('Activity states', activityStates)
  console.log('Flow periods', flowPeriods)
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
  console.log('Starting flow period score job at', DateTime.now().toISO())
  console.log('next run at', DateTime.now().plus({ milliseconds: intervalMs }).toISO())
  setInterval(async () => {
    console.log('Calculating flow period score')
    const lastFlowPeriod = await FlowPeriodDb.getLastFlowPeriod()
    const period = await getNextFlowPeriod(lastFlowPeriod, intervalMs)
    const flowPeriodScore = await getFlowPeriodScoreForPeriod(period)
    if (SHOULD_SAVE_FLOW_PERIOD) {
      await createFlowPeriod({
        start_time: period.start.toISO()!,
        end_time: period.end.toISO()!,
        score: flowPeriodScore.totalScore,
        details: JSON.stringify(flowPeriodScore),
        created_at: DateTime.now().toISO()!
      })
    }
    console.log('next run at', DateTime.now().plus({ milliseconds: intervalMs }).toISO())
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
