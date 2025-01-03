import Database, { QueryResult } from "@tauri-apps/plugin-sql";

export const insert = async (db: Database, table: string, record: Record<string, string>): Promise<QueryResult> => {
  const keys = Object.keys(record);
  const values = Object.values(record);
  const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${values.map(() => '?').join(', ')})`;
  const result = await db.execute(query, values);
  return result;
}

export const update = async (db: Database, table: string, record: Record<string, string>, id: string) => {
  const keys = Object.keys(record);
  const values = Object.values(record);
  const query = `UPDATE ${table} SET ${keys.map((key) => `${key} = ?`).join(', ')} WHERE id = ?`;
  const result = await db.execute(query, [...values, id]);
  return result;
}