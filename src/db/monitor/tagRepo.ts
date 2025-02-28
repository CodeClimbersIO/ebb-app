import { MonitorDb } from './monitorDb'

export type TagType = 'default' | 'category'
export interface TagSchema {
  id: string
  name: string
  tag_type: TagType
  is_default: boolean
  is_blocked: boolean
  created_at: string
  updated_at: string
  parent_tag_id: string | null
}
export type Tag = TagSchema & {
}

const getTagsByType = async (type: TagType): Promise<Tag[]> => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const tags = await monitorDb.select<TagSchema[]>(`SELECT * FROM tag WHERE tag_type = '${type}';`)
  return tags
}

export interface TagWithAppCount extends TagSchema {
  count: number;
}

const getCategoriesWithAppCounts = async (tagIds: string[]): Promise<TagWithAppCount[]> => {
  if (tagIds.length === 0) return []
  
  const monitorDb = await MonitorDb.getMonitorDb()
  
  const categories = await monitorDb.select<TagWithAppCount[]>(
    `SELECT t.*, COUNT(at.app_id) as count 
     FROM tag t
     LEFT JOIN app_tag at ON t.id = at.tag_id
     WHERE t.id IN (${tagIds.map(() => '?').join(',')})
     AND t.tag_type = 'category'
     GROUP BY t.id`,
    [...tagIds]
  )
  
  return categories
}

export const TagRepo = {
  getTagsByType,
  getCategoriesWithAppCounts
}
