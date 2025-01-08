import  { QueryResult } from '@tauri-apps/plugin-sql';
import { FlowSession, FlowSessionDb } from '../db/flowSession';
import { ActivityState } from '../db/activityState';
import { MonitorApi } from './monitorApi';
import { DateTime } from 'luxon';
import { ActivityFlowPeriod } from '../db/activityFlowPeriod';

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
  const flowSession: FlowSession = {
    id: self.crypto.randomUUID(),
    start: new Date().toISOString(),
    objective,
    self_score: 0,
  }
  if (await FlowSessionDb.getInProgressFlowSession()) {
    throw new Error('Flow session already in progress');
  }
  await FlowSessionDb.createFlowSession(flowSession);
  return flowSession.id;
}

const endFlowSession = async (id: string): Promise<QueryResult> => {
  const flowSession: Partial<FlowSession> & { id: string } = {
    id,
    end: new Date().toISOString(),
  }
  return FlowSessionDb.updateFlowSession(flowSession);
}

const scoreFlowSession = async (id: string, score: number): Promise<QueryResult> => {
  const flowSession: Partial<FlowSession> & { id: string } = {
    id,
    self_score: score,
  }
  return FlowSessionDb.updateFlowSession(flowSession);
}

const getInProgressFlowSession = async () => {
  return FlowSessionDb.getInProgressFlowSession();
}

type FlowSessionWithStats = FlowSession & {
  score: number;
  timeInFlow: number;
  activityStates: ActivityState[];
  activityFlowPeriods: ActivityFlowPeriod[];
}

const calculateTimeAndScoreInFlow = async (flowSession: FlowSession&{activityStates: ActivityState[], activityFlowPeriods: ActivityFlowPeriod[]}): Promise<FlowSessionWithStats> => {
  console.log('flowSession', flowSession)
  const timeInFlow = flowSession.activityFlowPeriods.reduce((acc, activityFlowPeriod) => {
    console.log('activityFlowPeriod', activityFlowPeriod)
    if (activityFlowPeriod.score > 5) {
      const start = DateTime.fromISO(activityFlowPeriod.start_time);
      const end = DateTime.fromISO(activityFlowPeriod.end_time);
      return acc + end.diff(start).milliseconds;
    }
    console.log('activityFlowPeriod', activityFlowPeriod)
    return acc;
  }, 0);

  const avgScore = flowSession.activityFlowPeriods.reduce((acc, activityFlowPeriod) => {
    return acc + activityFlowPeriod.score;
  }, 0) / flowSession.activityFlowPeriods.length;

  return {
    ...flowSession,
    timeInFlow,
    score: avgScore,
    activityStates: flowSession.activityStates,
    activityFlowPeriods: flowSession.activityFlowPeriods,
  }
}
const getFlowSessions = async (limit: number = 10): Promise<FlowSessionWithStats[]> => {
  const flowSessions = await FlowSessionDb.getFlowSessions(limit);
  
  const preCalculatedFlowSessions = await Promise.all(flowSessions.map(async (flowSession) => {
    const {activityStates, activityFlowPeriods} = await MonitorApi.getActivityAndFlowPeriodsBetween(flowSession.start, flowSession.end || new Date().toISOString());
    return {
      ...flowSession,
      activityStates,
      activityFlowPeriods,
    }
  }));

  const flowSessionsWithStats = await Promise.all(preCalculatedFlowSessions.map(async (flowSession) => {
    return calculateTimeAndScoreInFlow(flowSession);
  }));
  
  return flowSessionsWithStats;
}

export const EbbApi = {
  startFlowSession,
  endFlowSession,
  scoreFlowSession,
  getInProgressFlowSession,
  getFlowSessions,
}