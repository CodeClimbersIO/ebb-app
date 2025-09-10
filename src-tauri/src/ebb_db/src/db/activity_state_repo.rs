use sqlx::{Pool, Sqlite};
use time::OffsetDateTime;

use crate::db::models::activity_state::ActivityState;

pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;

pub struct ActivityStateRepo {
    pool: Pool<Sqlite>,
}

impl ActivityStateRepo {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    /// Get activity states within a date range that are ACTIVE
    pub async fn get_active_states_in_range(
        &self,
        start_time: OffsetDateTime,
        end_time: OffsetDateTime,
    ) -> Result<Vec<ActivityState>> {
        let states = sqlx::query_as::<_, ActivityState>(
            "SELECT * FROM activity_state 
             WHERE state = 'ACTIVE' 
               AND start_time < ?1 
               AND end_time > ?2
             ORDER BY start_time ASC"
        )
        .bind(end_time)
        .bind(start_time)
        .fetch_all(&self.pool)
        .await?;

        Ok(states)
    }

    /// Get activity states within a date range with specific tag
    pub async fn get_active_states_with_tag_in_range(
        &self,
        tag_name: &str,
        start_time: OffsetDateTime,
        end_time: OffsetDateTime,
    ) -> Result<Vec<ActivityState>> {
        let states = sqlx::query_as::<_, ActivityState>(
            "SELECT DISTINCT activity_state.* 
             FROM activity_state
             JOIN activity_state_tag ON activity_state.id = activity_state_tag.activity_state_id
             JOIN tag ON activity_state_tag.tag_id = tag.id
             WHERE activity_state.state = 'ACTIVE'
               AND tag.name = ?1
               AND activity_state.start_time < ?2
               AND activity_state.end_time > ?3
             ORDER BY activity_state.start_time ASC"
        )
        .bind(tag_name)
        .bind(end_time)
        .bind(start_time)
        .fetch_all(&self.pool)
        .await?;

        Ok(states)
    }

    /// Calculate total duration in minutes for activity states with specific tag in date range
    pub async fn calculate_tagged_duration_in_range(
        &self,
        tag_name: &str,
        start_time: OffsetDateTime,
        end_time: OffsetDateTime,
    ) -> Result<f64> {
        let total_minutes: Option<f64> = sqlx::query_scalar(
            "SELECT 
                COALESCE(SUM(
                    (julianday(
                        CASE 
                            WHEN activity_state.end_time > ?2 THEN ?2
                            ELSE activity_state.end_time
                        END
                    ) - julianday(
                        CASE 
                            WHEN activity_state.start_time < ?3 THEN ?3
                            ELSE activity_state.start_time
                        END
                    )) * 24 * 60
                ), 0.0) as total_minutes
            FROM activity_state
            JOIN activity_state_tag ON activity_state.id = activity_state_tag.activity_state_id
            JOIN tag ON activity_state_tag.tag_id = tag.id
            WHERE tag.name = ?1
                AND activity_state.state = 'ACTIVE'
                AND activity_state.start_time < ?2
                AND activity_state.end_time > ?3"
        )
        .bind(tag_name)
        .bind(end_time)
        .bind(start_time)
        .fetch_one(&self.pool)
        .await?;

        Ok(total_minutes.unwrap_or(0.0))
    }

    /// Get a single activity state by ID
    pub async fn get_activity_state(&self, id: i64) -> Result<Option<ActivityState>> {
        let state = sqlx::query_as::<_, ActivityState>(
            "SELECT * FROM activity_state WHERE id = ?1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(state)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;
    use time::macros::datetime;

    async fn create_test_db() -> Pool<Sqlite> {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();

        // Set WAL mode
        sqlx::query("PRAGMA journal_mode=WAL;")
            .execute(&pool)
            .await
            .unwrap();

        // Create the tables we need for testing
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS activity_state (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                state TEXT NOT NULL CHECK (state IN ('ACTIVE', 'INACTIVE')) DEFAULT 'INACTIVE',
                app_switches INTEGER NOT NULL DEFAULT 0,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )"
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS tag (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                parent_tag_id TEXT,
                tag_type TEXT NOT NULL,
                is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
                is_default BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_tag_id) REFERENCES tag(id),
                UNIQUE(name, tag_type)
            )"
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS activity_state_tag (
                activity_state_id TEXT NOT NULL,
                tag_id TEXT NOT NULL,
                app_tag_id TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (activity_state_id) REFERENCES activity_state(id),
                FOREIGN KEY (tag_id) REFERENCES tag(id),
                UNIQUE(activity_state_id, tag_id)
            )"
        )
        .execute(&pool)
        .await
        .unwrap();

        pool
    }

    #[tokio::test]
    async fn test_activity_state_repo_creation() -> Result<()> {
        let pool = create_test_db().await;
        let _repo = ActivityStateRepo::new(pool);
        Ok(())
    }

    #[tokio::test]
    async fn test_get_activity_state() -> Result<()> {
        let pool = create_test_db().await;
        let repo = ActivityStateRepo::new(pool.clone());

        // Insert test data
        let start_time = datetime!(2025-01-06 09:00 UTC);
        let end_time = datetime!(2025-01-06 10:00 UTC);
        let created_at = OffsetDateTime::now_utc();

        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at) 
             VALUES (1, 'ACTIVE', 5, ?1, ?2, ?3)"
        )
        .bind(start_time)
        .bind(end_time)
        .bind(created_at)
        .execute(&pool)
        .await?;

        // Test retrieval
        let result = repo.get_activity_state(1).await?;
        assert!(result.is_some());
        
        let activity_state = result.unwrap();
        assert_eq!(activity_state.id, 1);
        assert_eq!(activity_state.state, "ACTIVE");
        assert_eq!(activity_state.app_switches, 5);
        assert_eq!(activity_state.start_time, start_time);
        assert_eq!(activity_state.end_time, end_time);

        Ok(())
    }

    #[tokio::test]
    async fn test_get_activity_state_not_found() -> Result<()> {
        let pool = create_test_db().await;
        let repo = ActivityStateRepo::new(pool);

        let result = repo.get_activity_state(999).await?;
        assert!(result.is_none());

        Ok(())
    }

    #[tokio::test]
    async fn test_calculate_tagged_duration_in_range() -> Result<()> {
        let pool = create_test_db().await;
        let repo = ActivityStateRepo::new(pool.clone());

        // Create test tag
        let tag_id = "test-creating-tag";
        let now = OffsetDateTime::now_utc();
        sqlx::query(
            "INSERT INTO tag (id, name, tag_type, is_blocked, is_default, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
        )
        .bind(tag_id)
        .bind("creating")
        .bind("activity")
        .bind(false)
        .bind(false)
        .bind(now)
        .bind(now)
        .execute(&pool)
        .await?;

        // Create activity states (2 hours total)
        let start_time = datetime!(2025-01-06 09:00 UTC);
        let mid_time = datetime!(2025-01-06 10:00 UTC);
        let end_time = datetime!(2025-01-06 11:00 UTC);

        // First activity state (1 hour)
        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at) 
             VALUES (1, 'ACTIVE', 0, ?1, ?2, ?3)"
        )
        .bind(start_time)
        .bind(mid_time)
        .bind(now)
        .execute(&pool)
        .await?;

        // Second activity state (1 hour)
        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at) 
             VALUES (2, 'ACTIVE', 0, ?1, ?2, ?3)"
        )
        .bind(mid_time)
        .bind(end_time)
        .bind(now)
        .execute(&pool)
        .await?;

        // Create a different tag that shouldn't match
        let other_tag_id = "test-learning-tag";
        sqlx::query(
            "INSERT INTO tag (id, name, tag_type, is_blocked, is_default, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
        )
        .bind(other_tag_id)
        .bind("learning")
        .bind("activity")
        .bind(false)
        .bind(false)
        .bind(now)
        .bind(now)
        .execute(&pool)
        .await?;

        // Create activity state outside the time range (shouldn't be counted)
        let outside_start = datetime!(2025-01-06 06:00 UTC);
        let outside_end = datetime!(2025-01-06 07:00 UTC);
        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at) 
             VALUES (3, 'ACTIVE', 0, ?1, ?2, ?3)"
        )
        .bind(outside_start)
        .bind(outside_end)
        .bind(now)
        .execute(&pool)
        .await?;

        // Create INACTIVE activity state (shouldn't be counted even if in range and tagged)
        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at) 
             VALUES (4, 'INACTIVE', 0, ?1, ?2, ?3)"
        )
        .bind(start_time)
        .bind(mid_time)
        .bind(now)
        .execute(&pool)
        .await?;

        // Link first two activity states to the "creating" tag (should be counted)
        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at) 
             VALUES ('1', ?1, ?2, ?3)"
        )
        .bind(tag_id)
        .bind(now)
        .bind(now)
        .execute(&pool)
        .await?;

        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at) 
             VALUES ('2', ?1, ?2, ?3)"
        )
        .bind(tag_id)
        .bind(now)
        .bind(now)
        .execute(&pool)
        .await?;

        // Link activity state #3 (outside range) to creating tag (shouldn't be counted due to range)
        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at) 
             VALUES ('3', ?1, ?2, ?3)"
        )
        .bind(tag_id)
        .bind(now)
        .bind(now)
        .execute(&pool)
        .await?;

        // Link activity state #4 (INACTIVE) to creating tag (shouldn't be counted due to state)
        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at) 
             VALUES ('4', ?1, ?2, ?3)"
        )
        .bind(tag_id)
        .bind(now)
        .bind(now)
        .execute(&pool)
        .await?;

        // Create an activity state with the wrong tag (shouldn't be counted)
        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at) 
             VALUES (5, 'ACTIVE', 0, ?1, ?2, ?3)"
        )
        .bind(start_time)
        .bind(mid_time)
        .bind(now)
        .execute(&pool)
        .await?;

        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at) 
             VALUES ('5', ?1, ?2, ?3)"
        )
        .bind(other_tag_id) // Link to "learning" tag instead of "creating"
        .bind(now)
        .bind(now)
        .execute(&pool)
        .await?;

        // Test the calculation - should return 120 minutes (2 hours)
        let range_start = datetime!(2025-01-06 08:00 UTC);
        let range_end = datetime!(2025-01-06 12:00 UTC);
        
        let total_duration = repo.calculate_tagged_duration_in_range(
            "creating",
            range_start,
            range_end,
        ).await?;

        // Use approximate equality due to floating point precision in SQLite julianday calculations
        assert!((total_duration - 120.0).abs() < 0.01, "Expected ~120 minutes, got {}", total_duration);

        Ok(())
    }
}