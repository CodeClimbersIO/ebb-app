import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestDatabase, TestDatabaseManager, mockTauriDatabaseModules } from '../testDb.util'

describe('testDb.util', () => {
  describe('createTestDatabase', () => {
    it('should create an in-memory SQLite database', async () => {
      const db = await createTestDatabase()
      
      expect(db).toBeDefined()
      expect(typeof db.execute).toBe('function')
      expect(typeof db.select).toBe('function')
      expect(typeof db.close).toBe('function')
      
      await db.close()
    })

    it('should allow creating tables and inserting data', async () => {
      const db = await createTestDatabase()
      
      // Create a test table
      const createResult = await db.execute(`
        CREATE TABLE test_users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)
      expect(createResult.rowsAffected).toBe(0) // CREATE TABLE doesn't affect rows
      
      // Insert test data
      const insertResult = await db.execute(
        'INSERT INTO test_users (name) VALUES (?)',
        ['John Doe']
      )
      expect(insertResult.rowsAffected).toBe(1)
      
      // Query the data back
      const users = await db.select<Array<{id: number, name: string, created_at: string}>>(
        'SELECT * FROM test_users WHERE name = ?',
        ['John Doe']
      )
      
      expect(users).toHaveLength(1)
      expect(users[0].name).toBe('John Doe')
      expect(users[0].id).toBe(1)
      expect(users[0].created_at).toBeTruthy()
      
      await db.close()
    })

    it('should handle multiple concurrent operations', async () => {
      const db = await createTestDatabase()
      
      await db.execute(`
        CREATE TABLE concurrent_test (
          id INTEGER PRIMARY KEY,
          value TEXT
        )
      `)
      
      // Insert multiple records concurrently
      const insertPromises = Array.from({ length: 5 }, (_, i) => 
        db.execute('INSERT INTO concurrent_test (value) VALUES (?)', [`value-${i}`])
      )
      
      const results = await Promise.all(insertPromises)
      results.forEach(result => {
        expect(result.rowsAffected).toBe(1)
      })
      
      // Verify all records were inserted
      const records = await db.select('SELECT * FROM concurrent_test ORDER BY id')
      expect(records).toHaveLength(5)
      
      await db.close()
    })

    it('should handle SQL errors gracefully', async () => {
      const db = await createTestDatabase()
      
      // Try to select from non-existent table
      await expect(
        db.select('SELECT * FROM non_existent_table')
      ).rejects.toThrow()
      
      // Try invalid SQL
      await expect(
        db.execute('INVALID SQL STATEMENT')
      ).rejects.toThrow()
      
      await db.close()
    })
  })

  describe('TestDatabaseManager', () => {
    let manager: TestDatabaseManager

    beforeEach(() => {
      manager = new TestDatabaseManager()
    })

    afterEach(async () => {
      await manager.cleanup()
    })

    it('should create and manage separate EBB and Monitor databases', async () => {
      const ebbDb = await manager.getEbbTestDb()
      const monitorDb = await manager.getMonitorTestDb()
      
      expect(ebbDb).toBeDefined()
      expect(monitorDb).toBeDefined()
      expect(ebbDb).not.toBe(monitorDb) // Should be different instances
    })

    it('should return the same database instance on multiple calls', async () => {
      const ebbDb1 = await manager.getEbbTestDb()
      const ebbDb2 = await manager.getEbbTestDb()
      
      expect(ebbDb1).toBe(ebbDb2) // Should be the same instance
    })

    it('should create isolated databases', async () => {
      const ebbDb = await manager.getEbbTestDb()
      const monitorDb = await manager.getMonitorTestDb()
      
      // Create different tables in each database
      await ebbDb.execute('CREATE TABLE ebb_table (id INTEGER PRIMARY KEY, data TEXT)')
      await monitorDb.execute('CREATE TABLE monitor_table (id INTEGER PRIMARY KEY, info TEXT)')
      
      // Insert data into EBB database
      await ebbDb.execute('INSERT INTO ebb_table (data) VALUES (?)', ['ebb-data'])
      
      // Insert data into Monitor database
      await monitorDb.execute('INSERT INTO monitor_table (info) VALUES (?)', ['monitor-info'])
      
      // Verify isolation - each database only has its own data
      const ebbData = await ebbDb.select<Array<{data: string}>>('SELECT * FROM ebb_table')
      expect(ebbData).toHaveLength(1)
      expect(ebbData[0].data).toBe('ebb-data')
      
      const monitorData = await monitorDb.select<Array<{info: string}>>('SELECT * FROM monitor_table')
      expect(monitorData).toHaveLength(1)
      expect(monitorData[0].info).toBe('monitor-info')
      
      // Verify cross-database isolation
      await expect(
        ebbDb.select('SELECT * FROM monitor_table')
      ).rejects.toThrow() // Table doesn't exist in EBB database
      
      await expect(
        monitorDb.select('SELECT * FROM ebb_table') 
      ).rejects.toThrow() // Table doesn't exist in Monitor database
    })

    it('should cleanup databases properly', async () => {
      const ebbDb = await manager.getEbbTestDb()
      const monitorDb = await manager.getMonitorTestDb()
      
      // Create tables to verify they exist
      await ebbDb.execute('CREATE TABLE test_cleanup (id INTEGER)')
      await monitorDb.execute('CREATE TABLE test_cleanup (id INTEGER)')
      
      // Cleanup should close connections
      await expect(manager.cleanup()).resolves.not.toThrow()
      
      // After cleanup, attempting to use the databases should fail
      // Note: This might vary by SQLite implementation, but typically closed connections throw errors
      await expect(
        ebbDb.select('SELECT * FROM test_cleanup')
      ).rejects.toThrow()
    })
  })

  describe('mockTauriDatabaseModules', () => {
    it('should mock the required database modules', () => {
      mockTauriDatabaseModules()
      
      // The actual verification of mocks would be done in integration tests
      // Here we just verify the function runs without error
      expect(() => mockTauriDatabaseModules()).not.toThrow()
    })
  })

  describe('Database interface compatibility', () => {
    it('should implement the same interface as Tauri Database', async () => {
      const db = await createTestDatabase()
      
      // Verify required methods exist with correct signatures
      expect(db.execute).toBeInstanceOf(Function)
      expect(db.select).toBeInstanceOf(Function)
      expect(db.close).toBeInstanceOf(Function)
      
      // Test method signatures work as expected
      const executeResult = await db.execute('CREATE TABLE interface_test (id INTEGER)')
      expect(executeResult).toHaveProperty('rowsAffected')
      expect(typeof executeResult.rowsAffected).toBe('number')
      
      const selectResult = await db.select('SELECT 1 as test_value')
      expect(Array.isArray(selectResult)).toBe(true)
      
      await db.close()
    })

    it('should handle bind parameters the same way as Tauri Database', async () => {
      const db = await createTestDatabase()
      
      await db.execute('CREATE TABLE param_test (id INTEGER PRIMARY KEY, name TEXT, count INTEGER)')
      
      // Test with positional parameters
      await db.execute(
        'INSERT INTO param_test (name, count) VALUES (?, ?)',
        ['test-name', 42]
      )
      
      const results = await db.select<Array<{id: number, name: string, count: number}>>(
        'SELECT * FROM param_test WHERE name = ? AND count = ?',
        ['test-name', 42]
      )
      
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('test-name')
      expect(results[0].count).toBe(42)
      
      await db.close()
    })
  })
})

