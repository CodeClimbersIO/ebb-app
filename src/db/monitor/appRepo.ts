import { MonitorDb } from './monitorDb'

export interface AppDefinition {
  id: string
  is_browser: boolean
  app_name: string // name
  app_external_id: string // url or bundle id
  category: string // get from app_tag
}

export interface AppDb {
  id: string
  name: string
  tags_json?: string
  app_external_id: string
  is_browser: 0 | 1
}

export type App = AppDb & {
  tags?: AppTagJoined[]
  category_tag?: AppTagJoined
  default_tag?: AppTagJoined
  icon?: string
}

export interface AppTagJoined {
  id: string
  app_id: string
  tag_id: string
  weight: number
  tag_name: string
  tag_type: 'default' | 'category'
}

const setAppTag = async (id: string, tagId: string, weight: number) => {
  const monitorDb = await MonitorDb.getMonitorDb()
  await monitorDb.execute(
    `UPDATE app_tag SET tag_id = '${tagId}', weight = ${weight}, updated_at = '${new Date().toISOString()}' WHERE id = '${id}';`
  )
}

const getApps = async (): Promise<AppDb[]> => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const apps = await monitorDb.select<AppDb[]>(`
    SELECT a.*, json_group_array(
      json_object(
        'id', at.id,
        'app_id', at.app_id,
        'tag_id', at.tag_id,
        'weight', at.weight,
        'tag_type', t.tag_type,
        'tag_name', t.name
      )
    ) as "tags_json" 
    FROM app a
      LEFT JOIN app_tag at ON at.app_id = a.id
      LEFT JOIN tag t ON at.tag_id = t.id
    GROUP BY a.id, a.name, a.app_external_id, a.platform, a.is_browser, a.is_default, a.is_blocked, a.metadata, a.created_at, a.updated_at;
    `)
  return apps
}

const getAppsByIds = async (appIds: string[]): Promise<AppDb[]> => {
  if (appIds.length === 0) return []
  
  const monitorDb = await MonitorDb.getMonitorDb()
  const query = `
    SELECT * FROM app WHERE id IN (${appIds.map(() => '?').join(',')})`
  return await monitorDb.select(query, [...appIds])
}

const getAppsByCategoryTags = async (tagIds: string[]): Promise<AppDb[]> => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const query = `
    SELECT * FROM app a
    LEFT JOIN app_tag at ON at.app_id = a.id
    WHERE at.tag_id IN (${tagIds.map(() => '?').join(',')})`
  return monitorDb.select<AppDb[]>(query, [...tagIds])
}

const createApp = async (externalId: string, isBrowser: boolean, name = ''): Promise<string> => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const id = crypto.randomUUID()
  await monitorDb.execute(
    `INSERT INTO app (id, name, app_external_id, is_browser) VALUES ('${id}', '${name}', '${externalId}', ${isBrowser});`
  )
  try {
    const [neutralTag] = await monitorDb.select<AppTagJoined[]>(`
      SELECT * FROM tag WHERE tag_type = 'default' AND name = 'neutral';
    `)
    const appTagId = crypto.randomUUID()
    await monitorDb.execute(
      `INSERT INTO app_tag (id, app_id, tag_id, weight) VALUES ('${appTagId}', '${id}', '${neutralTag.id}', 1);`
    )
  } catch (error) {
    await monitorDb.execute(`DELETE FROM app WHERE id = '${id}';`)
    throw error
  }

  return id
}

export interface AppWithLastUsed extends AppDb {
  last_used?: string
  activity_count?: number
}

const getRecentlyUsedApps = async (limit = 100, offset = 0): Promise<AppWithLastUsed[]> => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const query = `
    SELECT
      a.*,
      MAX(act.timestamp) as last_used,
      COUNT(act.id) as activity_count
    FROM app a
    LEFT JOIN activity act ON act.app_id = a.id
    GROUP BY a.id
    HAVING last_used IS NOT NULL
    ORDER BY last_used DESC
    LIMIT ${limit} OFFSET ${offset}
  `
  return await monitorDb.select<AppWithLastUsed[]>(query)
}

const deleteApp = async (appId: string): Promise<void> => {
  const monitorDb = await MonitorDb.getMonitorDb()
  // Delete related records first (in order of foreign key dependencies)
  // 1. Delete activity_state_tag records that reference app_tag
  await monitorDb.execute(`DELETE FROM activity_state_tag WHERE app_tag_id IN (SELECT id FROM app_tag WHERE app_id = '${appId}')`)
  // 2. Delete activities
  await monitorDb.execute(`DELETE FROM activity WHERE app_id = '${appId}'`)
  // 3. Delete app_tag records
  await monitorDb.execute(`DELETE FROM app_tag WHERE app_id = '${appId}'`)
  // 4. Delete the app itself
  await monitorDb.execute(`DELETE FROM app WHERE id = '${appId}'`)
}

const deleteApps = async (appIds: string[]): Promise<void> => {
  if (appIds.length === 0) return
  const monitorDb = await MonitorDb.getMonitorDb()
  const placeholders = appIds.map(() => '?').join(',')
  // Delete in order of foreign key dependencies
  // 1. Delete activity_state_tag records that reference app_tag
  await monitorDb.execute(`DELETE FROM activity_state_tag WHERE app_tag_id IN (SELECT id FROM app_tag WHERE app_id IN (${placeholders}))`, appIds)
  // 2. Delete activities
  await monitorDb.execute(`DELETE FROM activity WHERE app_id IN (${placeholders})`, appIds)
  // 3. Delete app_tag records
  await monitorDb.execute(`DELETE FROM app_tag WHERE app_id IN (${placeholders})`, appIds)
  // 4. Delete the app itself
  await monitorDb.execute(`DELETE FROM app WHERE id IN (${placeholders})`, appIds)
}

const getAppCount = async (): Promise<number> => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const result = await monitorDb.select<[{ count: number }]>('SELECT COUNT(DISTINCT app_id) as count FROM activity WHERE app_id IS NOT NULL')
  return result[0]?.count || 0
}

export const AppRepo = {
  setAppTag,
  getApps,
  getAppsByIds,
  getAppsByCategoryTags,
  createApp,
  getRecentlyUsedApps,
  deleteApp,
  deleteApps,
  getAppCount,
}
