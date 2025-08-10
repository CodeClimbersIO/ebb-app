import { Database as SQLiteDatabase, sqlite3 } from 'sqlite3'
import type Database from '@tauri-apps/plugin-sql'
import { vi } from 'vitest'
import { runTestMigrations } from './testMigrations'

/**
 * Test database wrapper that mimics Tauri's Database interface
 * Uses sqlite3 directly for testing without Tauri runtime
 */
class TestDatabase {
  private db: SQLiteDatabase
  
  constructor(db: SQLiteDatabase) {
    this.db = db
  }

  async execute(sql: string, bindValues?: unknown[]): Promise<{ rowsAffected: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, bindValues || [], function(this: sqlite3['RunResult'], err) {
        if (err) {
          reject(err)
        } else {
          // `this` refers to the RunResult which has the changes property
          resolve({ rowsAffected: this.changes || 0 })
        }
      })
    })
  }

  async select<T = unknown[]>(sql: string, bindValues?: unknown[]): Promise<T> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, bindValues || [], (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows as T)
        }
      })
    })
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }
}

/**
 * Create an in-memory SQLite database for testing
 */
export const createTestDatabase = async (): Promise<Database> => {
  return new Promise((resolve, reject) => {
    const db = new SQLiteDatabase(':memory:', (err) => {
      if (err) {
        reject(err)
      } else {
        resolve(new TestDatabase(db) as unknown as Database)
      }
    })
  })
}

/**
 * Mock the Tauri database modules for testing
 */
export const mockTauriDatabaseModules = () => {
  // Mock the ebbDb module
  vi.doMock('@/db/ebb/ebbDb', () => ({
    getEbbDb: vi.fn(),
  }))
  
  // Mock the monitorDb module  
  vi.doMock('@/db/monitor/monitorDb', () => ({
    MonitorDb: {
      getMonitorDb: vi.fn(),
    }
  }))
}

/**
 * Test database manager for setting up isolated test databases with schema
 */
export class TestDatabaseManager {
  private ebbTestDb: Database | null = null
  private monitorTestDb: Database | null = null

  async getEbbTestDb(): Promise<Database> {
    if (!this.ebbTestDb) {
      this.ebbTestDb = await createTestDatabase()
      // Run migrations to set up the schema
      await runTestMigrations(this.ebbTestDb)
    }
    return this.ebbTestDb
  }

  async getMonitorTestDb(): Promise<Database> {
    if (!this.monitorTestDb) {
      this.monitorTestDb = await createTestDatabase()
      // Note: Monitor DB migrations would need to be added separately
      // For now, this creates an empty database
    }
    return this.monitorTestDb
  }

  async cleanup(): Promise<void> {
    if (this.ebbTestDb) {
      await this.ebbTestDb.close()
      this.ebbTestDb = null
    }
    if (this.monitorTestDb) {
      await this.monitorTestDb.close()
      this.monitorTestDb = null
    }
  }
}

/**
 * Create a test database with EBB schema already applied
 * Convenience function for simple test cases
 */
export const createEbbTestDatabase = async (): Promise<Database> => {
  const db = await createTestDatabase()
  await runTestMigrations(db)
  return db
}

