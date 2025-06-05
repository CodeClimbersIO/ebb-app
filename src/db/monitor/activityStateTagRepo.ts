import { MonitorDb } from './monitorDb'

const table = 'activity_state_tag'

const updateActivityStateTagById = async (appTagId: string,  newTagId: string) => {
  const monitorDb = await MonitorDb.getMonitorDb()
  const updatedAt = new Date().toISOString()

  await monitorDb.execute(
    `UPDATE ${table} SET tag_id = '${newTagId}', updated_at = '${updatedAt}' WHERE app_tag_id = '${appTagId}';`
  )
}

export const ActivityStateTagRepo = {
  updateActivityStateTagById,
}
