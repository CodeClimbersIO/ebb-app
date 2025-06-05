use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_flow_session",
            sql: r#"
          CREATE TABLE IF NOT EXISTS flow_session (
              id TEXT PRIMARY KEY NOT NULL,
              objective TEXT NOT NULL,
              self_score REAL,
              start DATETIME NOT NULL,
              end DATETIME
          );"#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_flow_period",
            sql: r#"
            CREATE TABLE IF NOT EXISTS flow_period (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                score REAL NOT NULL,
                details TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );"#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add_stats_to_flow_session",
            sql: r#"
            ALTER TABLE flow_session
            ADD COLUMN stats TEXT NOT NULL DEFAULT '{}';"#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add_previous_flow_period_id_to_flow_period",
            sql: r#"
            ALTER TABLE flow_period
            ADD COLUMN previous_flow_period_id INTEGER;
            CREATE UNIQUE INDEX idx_previous_flow_period
            ON flow_period(previous_flow_period_id)
            WHERE previous_flow_period_id IS NOT NULL;
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "add_duration_to_flow_session",
            sql: r#"
            ALTER TABLE flow_session
            ADD COLUMN duration INTEGER;
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "create_blocking_preference",
            sql: r#"
            CREATE TABLE IF NOT EXISTS blocking_preference (
                id TEXT PRIMARY KEY NOT NULL,
                app_id TEXT,
                tag_id TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );"#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "create_workflow",
            sql: r#"
            CREATE TABLE IF NOT EXISTS workflow (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                settings TEXT NOT NULL,
                last_selected TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );"#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "add_workflow_id_to_blocking_preference",
            sql: r#"
            ALTER TABLE blocking_preference ADD COLUMN workflow_id TEXT;
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "create_user_preference",
            sql: r#"
            CREATE TABLE IF NOT EXISTS user_preference (
                key TEXT PRIMARY KEY NOT NULL,
                value TEXT NOT NULL,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );"#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 10,
            description: "add_audit_timestamps_to_tables",
            sql: r#"
            -- Add timestamps to flow_session
            ALTER TABLE flow_session ADD COLUMN created_at DATETIME;
            ALTER TABLE flow_session ADD COLUMN updated_at DATETIME;
            
            -- Add updated_at to flow_period
            ALTER TABLE flow_period ADD COLUMN updated_at DATETIME;
            
            -- Update existing rows with current timestamp
            UPDATE flow_session SET created_at = datetime('now'), updated_at = datetime('now');
            UPDATE flow_period SET updated_at = datetime('now');
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 11,
            description: "create_user_profile",
            sql: r#"
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
            WHERE EXISTS (SELECT 1 FROM user_preference);
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 12,
            description: "create_user_notification",
            sql: r#"
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
            );"#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 13,
            description: "delete_duplicate_blocking_preferences",
            sql: r#"
            DELETE FROM blocking_preference 
            WHERE id NOT IN (
                SELECT MIN(id) 
                FROM blocking_preference 
                GROUP BY workflow_id, app_id, tag_id
            );

            CREATE UNIQUE INDEX IF NOT EXISTS idx_blocking_preference_workflow_tag_unique 
            ON blocking_preference(workflow_id, tag_id);
            
            CREATE UNIQUE INDEX IF NOT EXISTS idx_blocking_preference_workflow_app_unique 
            ON blocking_preference(workflow_id, app_id);"#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 14,
            description: "rename_user_profile_to_device_profile_and_add_device_id",
            sql: r#"
            ALTER TABLE user_profile RENAME TO device_profile;
            ALTER TABLE device_profile ADD COLUMN device_id TEXT;
            "#,
            kind: MigrationKind::Up,
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_migrations() {
        let migrations = get_migrations();
        assert!(!migrations.is_empty());
    }
}
