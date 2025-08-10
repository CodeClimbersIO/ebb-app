import type Database from '@tauri-apps/plugin-sql'

/**
 * Test migrations extracted from Rust migrations.rs (src-tauri/src/ebb_db/src/migrations.rs)
 * 
 * IMPORTANT: Keep in sync with Rust migrations when schema changes!
 * Last synced: 2024-01-08 (version 17)
 */

export interface TestMigration {
  version: number
  description: string
  sql: string
}

export const TEST_MIGRATIONS: TestMigration[] = [
  {
    version: 1,
    description: 'create_flow_session',
    sql: `
      CREATE TABLE IF NOT EXISTS flow_session (
          id TEXT PRIMARY KEY NOT NULL,
          objective TEXT NOT NULL,
          self_score REAL,
          start DATETIME NOT NULL,
          end DATETIME
      );`
  },
  {
    version: 2,
    description: 'create_flow_period',
    sql: `
      CREATE TABLE IF NOT EXISTS flow_period (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP NOT NULL,
          score REAL NOT NULL,
          details TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`
  },
  {
    version: 3,
    description: 'add_stats_to_flow_session',
    sql: `
      -- Add stats column if it doesn't exist
      ALTER TABLE flow_session ADD COLUMN stats TEXT NOT NULL DEFAULT '{}';`
  },
  {
    version: 4,
    description: 'add_previous_flow_period_id_to_flow_period',
    sql: `
      ALTER TABLE flow_period
      ADD COLUMN previous_flow_period_id INTEGER;
      CREATE UNIQUE INDEX idx_previous_flow_period
      ON flow_period(previous_flow_period_id)
      WHERE previous_flow_period_id IS NOT NULL;`
  },
  {
    version: 5,
    description: 'add_duration_to_flow_session',
    sql: `
      ALTER TABLE flow_session
      ADD COLUMN duration INTEGER;`
  },
  {
    version: 6,
    description: 'create_blocking_preference',
    sql: `
      CREATE TABLE IF NOT EXISTS blocking_preference (
          id TEXT PRIMARY KEY NOT NULL,
          app_id TEXT,
          tag_id TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`
  },
  {
    version: 7,
    description: 'create_workflow',
    sql: `
      CREATE TABLE IF NOT EXISTS workflow (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          settings TEXT NOT NULL,
          last_selected TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`
  },
  {
    version: 8,
    description: 'add_workflow_id_to_blocking_preference',
    sql: `
      ALTER TABLE blocking_preference ADD COLUMN workflow_id TEXT;`
  },
  {
    version: 9,
    description: 'create_user_preference',
    sql: `
      CREATE TABLE IF NOT EXISTS user_preference (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`
  },
  {
    version: 10,
    description: 'add_audit_timestamps_to_tables',
    sql: `
      -- Add timestamps to flow_session
      ALTER TABLE flow_session ADD COLUMN created_at DATETIME;
      ALTER TABLE flow_session ADD COLUMN updated_at DATETIME;
      
      -- Add updated_at to flow_period
      ALTER TABLE flow_period ADD COLUMN updated_at DATETIME;
      
      -- Update existing rows with current timestamp
      UPDATE flow_session SET created_at = datetime('now'), updated_at = datetime('now');
      UPDATE flow_period SET updated_at = datetime('now');`
  },
  {
    version: 11,
    description: 'create_user_profile',
    sql: `
      CREATE TABLE IF NOT EXISTS user_profile (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT,
          preferences TEXT NOT NULL DEFAULT '{}',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      -- Migrate user_preference data into user_profile.preferences (as a single row, if any exist)
      INSERT INTO user_profile (id, user_id, preferences, created_at, updated_at)
      SELECT
          'default',
          NULL,
          (
            SELECT '{' || group_concat('"' || key || '":' || value) || '}' FROM (
              SELECT key, json_quote(value) as value FROM user_preference
            )
          ),
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
      WHERE EXISTS (SELECT 1 FROM user_preference);`
  },
  {
    version: 12,
    description: 'create_user_notification',
    sql: `
      CREATE TABLE IF NOT EXISTS user_notification (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT,
          content TEXT NOT NULL,
          notification_type TEXT NOT NULL,
          notification_sub_type TEXT NOT NULL,
          notification_sent_id TEXT NOT NULL,
          read INTEGER NOT NULL DEFAULT 0,
          dismissed INTEGER NOT NULL DEFAULT 0,
          notification_sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, notification_sent_id)
      );`
  },
  {
    version: 13,
    description: 'delete_duplicate_blocking_preferences',
    sql: `
      DELETE FROM blocking_preference 
      WHERE id NOT IN (
          SELECT MIN(id) 
          FROM blocking_preference 
          GROUP BY workflow_id, app_id, tag_id
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_blocking_preference_workflow_tag_unique 
      ON blocking_preference(workflow_id, tag_id);
      
      CREATE UNIQUE INDEX IF NOT EXISTS idx_blocking_preference_workflow_app_unique 
      ON blocking_preference(workflow_id, app_id);`
  },
  {
    version: 14,
    description: 'rename_user_profile_to_device_profile_and_add_device_id',
    sql: `
      ALTER TABLE user_profile RENAME TO device_profile;
      ALTER TABLE device_profile ADD COLUMN device_id TEXT;
      CREATE UNIQUE INDEX idx_device_profile_device_id_unique ON device_profile(device_id);

      CREATE TABLE IF NOT EXISTS device (
          id TEXT PRIMARY KEY NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`
  },
  {
    version: 15,
    description: 'add_workflow_id_to_flow_session_and_set_default_workflow_in_device_profile',
    sql: `
      ALTER TABLE flow_session ADD COLUMN workflow_id TEXT;
      ALTER TABLE flow_session ADD COLUMN type TEXT;`
  },
  {
    version: 16,
    description: 'ensure_single_active_flow_session',
    sql: `
      -- Delete duplicate active flow sessions, keeping only the most recent one
      DELETE FROM flow_session 
      WHERE end IS NULL 
      AND id NOT IN (
          SELECT id 
          FROM flow_session 
          WHERE end IS NULL 
          ORDER BY start DESC 
          LIMIT 1
      );

      -- Create a unique constraint to ensure only one active session can exist
      CREATE UNIQUE INDEX idx_single_active_session 
      ON flow_session(1) 
      WHERE end IS NULL;`
  },
  {
    version: 17,
    description: 'create_focus_schedule',
    sql: `
      CREATE TABLE IF NOT EXISTS focus_schedule (
          id TEXT PRIMARY KEY NOT NULL,
          label TEXT,
          scheduled_time DATETIME NOT NULL,
          workflow_id TEXT NOT NULL,
          recurrence_settings TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workflow_id) REFERENCES workflow (id)
      );
      ALTER TABLE flow_session ADD COLUMN focus_schedule_id TEXT;`
  },
]

/**
 * Run all test migrations on a database
 */
export async function runTestMigrations(db: Database): Promise<void> {
  for (const migration of TEST_MIGRATIONS) {
    try {
      await db.execute(migration.sql)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Some migrations may fail on re-run due to schema already existing
      // This is expected for ADD COLUMN operations
      const isExpectedError = errorMessage.includes('duplicate column name') ||
                             errorMessage.includes('already exists') ||
                             errorMessage.includes('constraint failed') ||
                             errorMessage.includes('already another table or index with this name')
      
      if (!isExpectedError) {
        throw new Error(`Migration ${migration.version} (${migration.description}) failed: ${error}`)
      }
      // Silently continue for expected errors
    }
  }
}

/**
 * Get the latest migration version (for validation)
 */
export function getLatestMigrationVersion(): number {
  return Math.max(...TEST_MIGRATIONS.map(m => m.version))
}

/**
 * Verify that focus_schedule table exists with correct schema
 * This is our key table for the current test example
 */
export async function verifyFocusScheduleSchema(db: Database): Promise<void> {
  // Check table exists
  const tables = await db.select<Array<{name: string}>>(
    'SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'focus_schedule\''
  )
  
  if (tables.length === 0) {
    throw new Error('focus_schedule table does not exist')
  }

  // Check key columns exist
  const columns = await db.select<Array<{name: string, type: string}>>(
    'PRAGMA table_info(focus_schedule)'
  )
  
  const expectedColumns = [
    'id', 'label', 'scheduled_time', 'workflow_id', 
    'recurrence_settings', 'is_active', 'created_at', 'updated_at'
  ]
  
  const actualColumns = columns.map(c => c.name)
  
  for (const expectedCol of expectedColumns) {
    if (!actualColumns.includes(expectedCol)) {
      throw new Error(`Missing column '${expectedCol}' in focus_schedule table`)
    }
  }
}

