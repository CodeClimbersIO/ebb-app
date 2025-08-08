export type QueryResult = { rowsAffected?: number }

export default class Database {
  static async load(_url: string) {
    return new Database()
  }
  async select<T = unknown>(_query: string, _params?: unknown[]): Promise<T[]> {
    return [] as T[]
  }
  async execute(_query: string, _params?: unknown[]): Promise<QueryResult> {
    return { rowsAffected: 0 }
  }
}

