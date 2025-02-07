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

export const TagRepo = {
  getTagsByType,
}
