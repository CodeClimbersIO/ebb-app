import { MonitorDb } from './monitorDb'

const setAppDefaultTag = async (id: string, tagId: string) => {
  const monitorDb = await MonitorDb.getMonitorDb()
  await monitorDb.execute(`UPDATE app_tag SET tag_id = '${tagId}' WHERE id = '${id}';`)
}

export const AppRepo = {
  setAppDefaultTag,
}
