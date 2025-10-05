import { MonitorDb } from '@/db/monitor/monitorDb'

export enum ActivityType {
  Window = 'WINDOW',
  Mouse = 'MOUSE',
  Keyboard = 'KEYBOARD',
}

export interface Activity {
  id?: number
  activity_type: ActivityType
  app_window_title: string
  created_at: string
  timestamp: string
  bundle_id: string
  app_id?: string
}

export interface ActivityWithApp extends Activity {
  app_name?: string
  app_external_id?: string
}

const getLatestActivity = async (): Promise<Activity | undefined> => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const query = 'SELECT * FROM activity ORDER BY id DESC LIMIT 1'
  const [activity] = await monitorDb.select<Activity[]>(query)

  return activity
}

const getActivities = async (limit = 100, offset = 0): Promise<ActivityWithApp[]> => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const query = `
    SELECT
      a.id,
      a.activity_type,
      a.app_window_title,
      a.created_at,
      a.timestamp,
      a.bundle_id,
      a.app_id,
      app.name as app_name,
      app.app_external_id
    FROM activity a
    LEFT JOIN app ON app.id = a.app_id
    ORDER BY a.id DESC
    LIMIT ${limit} OFFSET ${offset}
  `
  const activities = await monitorDb.select<ActivityWithApp[]>(query)
  return activities
}

const getActivitiesByDateRange = async (startDate: string, endDate: string): Promise<ActivityWithApp[]> => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const query = `
    SELECT
      a.id,
      a.activity_type,
      a.app_window_title,
      a.created_at,
      a.timestamp,
      a.bundle_id,
      a.app_id,
      app.name as app_name,
      app.app_external_id
    FROM activity a
    LEFT JOIN app ON app.id = a.app_id
    WHERE a.timestamp >= '${startDate}' AND a.timestamp <= '${endDate}'
    ORDER BY a.id DESC
  `
  const activities = await monitorDb.select<ActivityWithApp[]>(query)
  return activities
}

const deleteActivity = async (id: number): Promise<void> => {
  const monitorDb = await MonitorDb.getMonitorDb()
  await monitorDb.execute(`DELETE FROM activity WHERE id = ${id}`)
}

const deleteActivities = async (ids: number[]): Promise<void> => {
  if (ids.length === 0) return
  const monitorDb = await MonitorDb.getMonitorDb()
  const placeholders = ids.map(() => '?').join(',')
  await monitorDb.execute(`DELETE FROM activity WHERE id IN (${placeholders})`, ids)
}

const deleteAllActivities = async (): Promise<void> => {
  const monitorDb = await MonitorDb.getMonitorDb()
  await monitorDb.execute('DELETE FROM activity')
}

const getActivityCount = async (): Promise<number> => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const result = await monitorDb.select<[{ count: number }]>('SELECT COUNT(*) as count FROM activity')
  return result[0]?.count || 0
}

export const ActivityRepo = {
  getLatestActivity,
  getActivities,
  getActivitiesByDateRange,
  deleteActivity,
  deleteActivities,
  deleteAllActivities,
  getActivityCount,
}
