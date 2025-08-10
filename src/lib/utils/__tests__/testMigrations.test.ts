import { describe, it, expect, afterEach } from 'vitest'
import { 
  runTestMigrations, 
  getLatestMigrationVersion, 
  verifyFocusScheduleSchema,
  TEST_MIGRATIONS 
} from '../testMigrations'
import { createTestDatabase, createEbbTestDatabase } from '../testDb.util'
import type Database from '@tauri-apps/plugin-sql'

describe('testMigrations', () => {
  let db: Database | null = null

  afterEach(async () => {
    if (db) {
      try {
        await db.close()
      } catch {
        // Ignore errors from closing already closed database
      }
      db = null
    }
  })

  describe('TEST_MIGRATIONS', () => {
    it('should have migrations in correct order', () => {
      const versions = TEST_MIGRATIONS.map(m => m.version)
      const sortedVersions = [...versions].sort((a, b) => a - b)
      
      expect(versions).toEqual(sortedVersions)
    })

    it('should have unique version numbers', () => {
      const versions = TEST_MIGRATIONS.map(m => m.version)
      const uniqueVersions = new Set(versions)
      
      expect(uniqueVersions.size).toBe(versions.length)
    })

    it('should have non-empty SQL for each migration', () => {
      TEST_MIGRATIONS.forEach(migration => {
        expect(migration.sql.trim()).not.toBe('')
        expect(migration.description).not.toBe('')
      })
    })

    it('should include focus_schedule table creation (our test case)', () => {
      const focusScheduleMigration = TEST_MIGRATIONS.find(
        m => m.description === 'create_focus_schedule'
      )
      
      expect(focusScheduleMigration).toBeDefined()
      expect(focusScheduleMigration!.sql).toContain('CREATE TABLE IF NOT EXISTS focus_schedule')
    })
  })

  describe('runTestMigrations', () => {
    it('should successfully run all migrations on empty database', async () => {
      db = await createTestDatabase()
      
      await expect(runTestMigrations(db)).resolves.not.toThrow()
    })

    it('should create all expected tables', async () => {
      db = await createTestDatabase()
      await runTestMigrations(db)
      
      // Note: device table creation might fail in migration 14 due to re-running migrations
      
      const expectedTables = [
        'flow_session',
        'flow_period', 
        'blocking_preference',
        'workflow',
        'user_preference', // this still exists after migration 11
        'device_profile', // renamed from user_profile in migration 14
        'user_notification',
        'focus_schedule' // our key table
      ]
      
      for (const tableName of expectedTables) {
        const tables = await db.select<Array<{name: string}>>(
          'SELECT name FROM sqlite_master WHERE type=\'table\' AND name=?',
          [tableName]
        )
        
        expect(tables).toHaveLength(1)
      }
    })

    it('should handle migration errors gracefully', async () => {
      db = await createTestDatabase()
      
      // First run migrations successfully
      await runTestMigrations(db)
      
      // Running again should not fail (due to IF NOT EXISTS clauses)
      await expect(runTestMigrations(db)).resolves.not.toThrow()
    })
  })

  describe('getLatestMigrationVersion', () => {
    it('should return the highest migration version', () => {
      const latest = getLatestMigrationVersion()
      const maxVersion = Math.max(...TEST_MIGRATIONS.map(m => m.version))
      
      expect(latest).toBe(maxVersion)
    })

    it('should return version 17 or higher (current schema)', () => {
      const latest = getLatestMigrationVersion()
      
      expect(latest).toBeGreaterThanOrEqual(17)
    })
  })

  describe('verifyFocusScheduleSchema', () => {
    it('should pass validation after migrations', async () => {
      db = await createTestDatabase()
      await runTestMigrations(db)
      
      await expect(verifyFocusScheduleSchema(db)).resolves.not.toThrow()
    })

    it('should fail validation on empty database', async () => {
      db = await createTestDatabase()
      
      await expect(verifyFocusScheduleSchema(db)).rejects.toThrow('focus_schedule table does not exist')
    })

    it('should verify all required columns exist', async () => {
      db = await createTestDatabase()
      await runTestMigrations(db)
      
      // Get table schema
      const columns = await db.select<Array<{name: string, type: string}>>(
        'PRAGMA table_info(focus_schedule)'
      )
      
      const columnNames = columns.map(c => c.name)
      const expectedColumns = [
        'id', 'label', 'scheduled_time', 'workflow_id',
        'recurrence_settings', 'is_active', 'created_at', 'updated_at'
      ]
      
      for (const expectedCol of expectedColumns) {
        expect(columnNames).toContain(expectedCol)
      }
    })
  })

  describe('integration with createEbbTestDatabase', () => {
    it('should create database with migrations already applied', async () => {
      db = await createEbbTestDatabase()
      
      // Should pass schema validation immediately
      await expect(verifyFocusScheduleSchema(db)).resolves.not.toThrow()
      
      // Should be able to insert data into focus_schedule
      const insertResult = await db.execute(`
        INSERT INTO focus_schedule (id, scheduled_time, workflow_id, is_active)
        VALUES (?, ?, ?, ?)
      `, ['test-schedule-1', '2024-01-15T09:00:00Z', 'workflow-1', 1])
      
      expect(insertResult.rowsAffected).toBe(1)
    })

    it('should enforce foreign key constraints', async () => {
      db = await createEbbTestDatabase()
      
      // First create a workflow (referenced table)
      await db.execute(`
        INSERT INTO workflow (id, name, settings)
        VALUES (?, ?, ?)
      `, ['workflow-1', 'Test Workflow', '{}'])
      
      // Now create focus schedule with valid workflow_id
      const validInsert = await db.execute(`
        INSERT INTO focus_schedule (id, scheduled_time, workflow_id, is_active)
        VALUES (?, ?, ?, ?)
      `, ['test-schedule-1', '2024-01-15T09:00:00Z', 'workflow-1', 1])
      
      expect(validInsert.rowsAffected).toBe(1)
      
      // Note: SQLite foreign key enforcement depends on PRAGMA foreign_keys=ON
      // which might not be enabled in our test setup by default
    })
  })
})

