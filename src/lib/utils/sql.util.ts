import Database, { QueryResult } from '@tauri-apps/plugin-sql'

export const insert = async (
  db: Database,
  table: string,
  record: object,
): Promise<QueryResult> => {
  const now = new Date().toISOString()
  const recordWithTimestamps = {
    ...record,
    created_at: now,
    updated_at: now,
  }
  const keys = Object.keys(recordWithTimestamps)
  const values = Object.values(recordWithTimestamps)
  const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${values.map(() => '?').join(', ')})`
  const result = await db.execute(query, values)
  return result
}

export const update = async (
  db: Database,
  table: string,
  record: object,
  id: string,
) => {
  const now = new Date().toISOString()
  const recordWithTimestamp = {
    ...record,
    updated_at: now,
  }
  const keys = Object.keys(recordWithTimestamp)
  const values = Object.values(recordWithTimestamp)
  const query = `UPDATE ${table} SET ${keys.map((key) => `${key} = ?`).join(', ')} WHERE id = ?`
  const result = await db.execute(query, [...values, id])
  return result
}

export const toSqlBool = (value?: boolean): number => {
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'number') return value
  return 0
}
