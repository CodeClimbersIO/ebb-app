import  { QueryResult } from '@tauri-apps/plugin-sql';
import { FlowSession, FlowSessionDb } from '../db/flowSession';

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

export const EbbApi = {
  startFlowSession,
  endFlowSession,
  scoreFlowSession,
  getInProgressFlowSession,
}