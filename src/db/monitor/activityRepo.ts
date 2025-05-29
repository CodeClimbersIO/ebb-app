import { MonitorDb } from '@/db/monitor/monitorDb'

export enum ActivityType {
  Window = 'WINDOW',
  Mouse = 'MOUSE',
  Keyboard = 'KEYBOARD',
}

export interface Activity {
  activity_type: ActivityType
  app_window_title: string
  created_at: string
  timestamp: string
  bundle_id: string
}

const getLatestActivity = async (): Promise<Activity | undefined> => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const query = 'SELECT * FROM activity ORDER BY id DESC LIMIT 1'
  const [activity] = await monitorDb.select<Activity[]>(query)
  
  return activity
}

export const ActivityRepo = {
  getLatestActivity,
}
