export type QueryResult = { rowsAffected?: number }

export default class Database {
  static async load() {
    return new Database()
  }
  async select<T = unknown>(): Promise<T[]> {
    return [] as T[]
  }
  async execute(): Promise<QueryResult> {
    return { rowsAffected: 0 }
  }
}

