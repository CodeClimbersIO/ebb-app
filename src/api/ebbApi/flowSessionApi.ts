import { QueryResult } from '@tauri-apps/plugin-sql'
import { FlowSession, FlowSessionDb, FlowSessionStats, FlowSessionPeriodComparison } from '../../db/flowSession'
import { ActivityState, ActivityStateType } from '../../db/activityState'
import { FlowPeriod } from '../../db/flowPeriod'
import { DateTime } from 'luxon'
import { MonitorApi } from '../monitorApi'

/** Example usage
 * 
  const handleStartFlowSession = async () => {
    await EbbApi.startFlowSession('Learn React');
  }

  const handleEndFlowSession = async () => {
    const currentFlowSession = await EbbApi.getInProgressFlowSession();
    if (!currentFlowSession) {
      return;
    }
    const flowSession = await EbbApi.endFlowSession(currentFlowSession.id);
  }
 */
const startFlowSession = async (objective: string): Promise<string> => {
  const flowSession: FlowSessionDb = {
    id: self.crypto.randomUUID(),
    start: new Date().toISOString(),
    objective,
    self_score: 0,
  }
  if (await FlowSessionDb.getInProgressFlowSession()) {
    throw new Error('Flow session already in progress')
  }
  await FlowSessionDb.createFlowSession(flowSession)
  return flowSession.id
}

const endFlowSession = async (id: string): Promise<QueryResult> => {
  const flowSession = await FlowSessionDb.getInProgressFlowSession()
  if (!flowSession) {
    throw new Error('Flow session not found')
  }
  console.log('In progress flow session', flowSession)

  const { activityStates, activityFlowPeriods } =
    await MonitorApi.getActivityAndFlowPeriodsBetween(
      DateTime.fromISO(flowSession.start),
      DateTime.fromISO(flowSession.end || new Date().toISOString()),
    )

  const flowSessionWithActivitiesAndPeriods = {
    ...flowSession,
    activityStates,
    activityFlowPeriods,
  }

  const flowSessionWithStats = await calculateTimeAndScoreInFlow(flowSessionWithActivitiesAndPeriods)

  const flowSessionUpdated: Partial<FlowSession> & { id: string } = {
    id,
    end: new Date().toISOString(),
    stats: flowSessionWithStats.stats,
  }

  return FlowSessionDb.updateFlowSession(flowSessionUpdated)
}

const scoreFlowSession = async (
  id: string,
  score: number,
): Promise<QueryResult> => {
  const flowSession: Partial<FlowSession> & { id: string } = {
    id,
    self_score: score,
  }
  return FlowSessionDb.updateFlowSession(flowSession)
}

const getInProgressFlowSession = async () => {
  return FlowSessionDb.getInProgressFlowSession()
}

const calculateTimeAndScoreInFlow = async (
  flowSession: FlowSession & {
    activityFlowPeriods: FlowPeriod[]
    activityStates: ActivityState[]
  },
): Promise<FlowSession> => {
  const timeInFlow = flowSession.activityFlowPeriods.reduce(
    (acc, activityFlowPeriod) => {
      if (activityFlowPeriod.score > 5) {
        const start = DateTime.fromISO(activityFlowPeriod.start_time)
        const end = DateTime.fromISO(activityFlowPeriod.end_time)
        return acc + end.diff(start).milliseconds
      }
      return acc
    },
    0,
  )

  const avgScore =
    flowSession.activityFlowPeriods.reduce((acc, activityFlowPeriod) => {
      return acc + activityFlowPeriod.score
    }, 0) / flowSession.activityFlowPeriods.length

  const activeSeconds = flowSession.activityStates.reduce((acc, activityState) => {
    return acc + (activityState.state === ActivityStateType.Active ? 30 : 0)
  }, 0)

  const totalSeconds = flowSession.activityStates.reduce((acc) => {
    return acc + 30
  }, 0)

  const inactiveTime = totalSeconds - activeSeconds
  const stats = {
    time_in_flow: timeInFlow,
    inactive_time: inactiveTime,
    active_time: activeSeconds,
    avg_score: avgScore,
  }
  return {
    ...flowSession,
    stats: JSON.stringify(stats),
  }
}

const calculateStatsFromFlowSessions = async (flowSessions: FlowSession[]): Promise<FlowSessionStats> => {
  const stats = flowSessions.map((flowSession) => JSON.parse(flowSession.stats || '{}'))
  const timeInFlow = stats.reduce((acc, flowSession) => {
    return acc + (flowSession.time_in_flow || 0)
  }, 0)
  const avgScore = flowSessions.length > 0 
    ? stats.reduce((acc, flowSession) => {
        return acc + (flowSession.avg_score || 0)
      }, 0) / flowSessions.length
    : 0
  const inactiveTime = stats.reduce((acc, flowSession) => {
    return acc + (flowSession.inactive_time || 0)
  }, 0)
  const activeTime = stats.reduce((acc, flowSession) => {
    return acc + (flowSession.active_time || 0)
  }, 0)
  return {
    time_in_flow: timeInFlow,
    avg_score: avgScore,
    inactive_time: inactiveTime,
    active_time: activeTime,
  }
}

const getFlowSessions = async (limit = 10): Promise<FlowSession[]> => {
  const flowSessions = await FlowSessionDb.getFlowSessions(limit)
  return flowSessions
}

const getFlowSessionPeriodComparisons = async (period: 'day' | 'week' | 'month' | 'year'): Promise<FlowSessionPeriodComparison> => {
  const [current, previous] = await FlowSessionDb.getFlowSessionPeriodComparisons(period)
  const currentStats = await calculateStatsFromFlowSessions(current)
  const previousStats = await calculateStatsFromFlowSessions(previous)
  return {
    current: {
      sessions: current,
      stats: currentStats,
    },
    previous: {
      sessions: previous,
      stats: previousStats,
    },
  }
}

export const FlowSessionApi = {
  startFlowSession,
  endFlowSession,
  scoreFlowSession,
  getInProgressFlowSession,
  getFlowSessions,
  getFlowSessionPeriodComparisons,
}
