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
  is_browser: boolean
}

export type App = AppDb & {
  tags?: AppTagJoined[]
  category_tag?: AppTagJoined
  default_tag?: AppTagJoined
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

export const AppRepo = {
  setAppTag,
  getApps,
}
