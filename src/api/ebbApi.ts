import Database, { QueryResult } from '@tauri-apps/plugin-sql';
import { homeDir, join } from '@tauri-apps/api/path';
import { insert, update } from '../lib/sql.util';
import { FlowSession } from '../models/flowSession';

let ebbDb: Database | null = null;

const getEbbDb = async () => {
  if (ebbDb) {
    return ebbDb;
  }
  const homeDirectory = await homeDir();
  const ebbDbPath = await join(homeDirectory, '.ebb', 'ebb-desktop.sqlite');
  ebbDb = await Database.load(`sqlite:${ebbDbPath}`);
  return ebbDb;
}
const getFlowSessions = async () => {
  const ebbDb = await getEbbDb();
  const flowSessions = await ebbDb.select('SELECT * FROM flow_session LIMIT 10;');
  return flowSessions;
}

const createFlowSession = async (flowSession: FlowSession): Promise<QueryResult> => {
  const ebbDb = await getEbbDb();
  return insert(ebbDb, 'flow_session', flowSession);
}

const updateFlowSession = async (flowSession: Partial<FlowSession> & { id: string }): Promise<QueryResult> => {
  const ebbDb = await getEbbDb();
  return update(ebbDb, 'flow_session', flowSession, flowSession.id);
}

const startFlowSession = async (objective: string): Promise<string> => {
  const flowSession: FlowSession = {
    id: self.crypto.randomUUID(),
    start: new Date().toISOString(),
    objective,
    self_score: 0,
  }
  await createFlowSession(flowSession);
  return flowSession.id;
}

const endFlowSession = async (id: string): Promise<QueryResult> => {
  const flowSession: Partial<FlowSession> & { id: string } = {
    id,
    end: new Date().toISOString(),
  }
  return updateFlowSession(flowSession);
}

const scoreFlowSession = async (id: string, score: number): Promise<QueryResult> => {
  const flowSession: Partial<FlowSession> & { id: string } = {
    id,
    self_score: score,
  }
  return updateFlowSession(flowSession);
}

export const EbbApi = {
  getFlowSessions,
  startFlowSession,
  endFlowSession,
  scoreFlowSession,
}