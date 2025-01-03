import Database from '@tauri-apps/plugin-sql';
import { homeDir, join } from '@tauri-apps/api/path';

let monitorDb: Database | null = null;
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

const getMonitorDb = async () => {
  if (monitorDb) {
    return monitorDb;
  }
  const homeDirectory = await homeDir();
  const monitorDbPath = await join(homeDirectory, '.codeclimbers', 'codeclimbers-desktop.sqlite');
  monitorDb = await Database.load(`sqlite:${monitorDbPath}`);
  return monitorDb;
}

const getActivities = async () => {
  const monitorDb = await getMonitorDb();
  const activities = await monitorDb.select('SELECT * FROM activity LIMIT 10;');
  return activities;
}

const getFlowSessions = async () => {
  const ebbDb = await getEbbDb();
  const flowSessions = await ebbDb.select('SELECT * FROM flow_session LIMIT 10;');
  return flowSessions;
}

export const MonitorApi = {
  getActivities,
}

export const EbbApi = {
  getFlowSessions,
}