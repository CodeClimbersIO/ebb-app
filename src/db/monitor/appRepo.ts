import { MonitorDb } from './monitorDb'

const setAppTag = async (id: string, tagId: string, weight: number) => {
  const monitorDb = await MonitorDb.getMonitorDb()
  await monitorDb.execute(
    `UPDATE app_tag SET tag_id = '${tagId}', weight = ${weight}, updated_at = '${new Date().toISOString()}' WHERE id = '${id}';`
  )
}

export const AppRepo = {
  setAppTag,
}
