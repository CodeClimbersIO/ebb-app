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
        log::debug!("Calculating tagged duration for tag '{}' from {} to {}", tag_name, start_time, end_time);

        let total_minutes: Option<f64> = sqlx::query_scalar(
            "SELECT
                COALESCE(SUM(creating_minutes), 0.0) as total_minutes
            FROM (
                SELECT
                    activity_state.id,
                    ROUND((julianday(
                        CASE
                            WHEN activity_state.end_time > ?2 THEN ?2
                            ELSE activity_state.end_time
                        END
                    ) - julianday(
                        CASE
                            WHEN activity_state.start_time < ?3 THEN ?3
                            ELSE activity_state.start_time
                        END
                    )) * 24 * 60) as creating_minutes
                FROM activity_state
                JOIN activity_state_tag ON activity_state.id = activity_state_tag.activity_state_id
                JOIN tag ON activity_state_tag.tag_id = tag.id
                WHERE tag.name = ?1
                    AND activity_state.start_time < ?2
                    AND activity_state.end_time > ?3
                GROUP BY activity_state.id
            ) as distinct_activities"
        )
        .bind(tag_name)
        .bind(end_time)
        .bind(start_time)
        .fetch_one(&self.pool)
        .await?;

        // Debug: Print the actual SQL query with substituted parameters
        let debug_sql = format!(
            "SELECT
                COALESCE(SUM(creating_minutes), 0.0) as total_minutes
            FROM (
                SELECT
                    activity_state.id,
                    (julianday(
                        CASE
                            WHEN activity_state.end_time > '{}' THEN '{}'
                            ELSE activity_state.end_time
                        END
                    ) - julianday(
                        CASE
                            WHEN activity_state.start_time < '{}' THEN '{}'
                            ELSE activity_state.start_time
                        END
                    )) * 24 * 60 as creating_minutes
                FROM activity_state
                JOIN activity_state_tag ON activity_state.id = activity_state_tag.activity_state_id
                JOIN tag ON activity_state_tag.tag_id = tag.id
                WHERE tag.name = '{}'
                    AND activity_state.start_time < '{}'
                    AND activity_state.end_time > '{}'
                GROUP BY activity_state.id
            ) as distinct_activities;",
            end_time, end_time, start_time, start_time, tag_name, end_time, start_time
        );

        println!("=== DEBUG SQL QUERY ===");
        println!("{}", debug_sql);
        println!("Query parameters: tag_name='{}', end_time={}, start_time={}", tag_name, end_time, start_time);
        println!("Total minutes result: {:?}", total_minutes);
        println!("=======================");

        Ok(total_minutes.unwrap_or(0.0))
    }

    /// Debug helper: Get raw activity states for a tag to manually verify calculation
    pub async fn debug_get_tagged_activity_states(
        &self,
        tag_name: &str,
        start_time: OffsetDateTime,
        end_time: OffsetDateTime,
    ) -> Result<()> {
        let states: Vec<(i64, OffsetDateTime, Option<OffsetDateTime>)> = sqlx::query_as(
            "SELECT activity_state.id, activity_state.start_time, activity_state.end_time
            FROM activity_state
            JOIN activity_state_tag ON activity_state.id = activity_state_tag.activity_state_id
            JOIN tag ON activity_state_tag.tag_id = tag.id
            WHERE tag.name = ?1
                AND activity_state.start_time < ?2
                AND activity_state.end_time > ?3
            ORDER BY activity_state.start_time"
        )
        .bind(tag_name)
        .bind(end_time)
        .bind(start_time)
        .fetch_all(&self.pool)
        .await?;

        println!("=== DEBUG ACTIVITY STATES FOR TAG '{}' ===", tag_name);
        println!("Query range: {} to {}", start_time, end_time);
        println!("Found {} matching activity states:", states.len());

        let mut total_manual = 0.0;
        for (id, start, end_opt) in states {
            if let Some(end) = end_opt {
                // Calculate overlap manually
                let actual_start = if start < start_time { start_time } else { start };
                let actual_end = if end > end_time { end_time } else { end };
                let duration = (actual_end - actual_start).whole_minutes() as f64;

                println!("  ID: {}, Original: {} to {}, Clipped: {} to {}, Duration: {:.2} min",
                    id, start, end, actual_start, actual_end, duration);
                total_manual += duration;
            }
        }
        println!("Manual calculation total: {:.2} minutes", total_manual);
        println!("===============================================");

        Ok(())
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
    use sqlx::{Pool, Sqlite};

    /// Clean all activity state related data for testing
    pub async fn cleanup_activity_state_data(pool: &Pool<Sqlite>) -> Result<()> {
        // Delete in reverse dependency order to avoid foreign key constraints
        sqlx::query("DELETE FROM activity_state_tag").execute(pool).await?;
        sqlx::query("DELETE FROM activity_state").execute(pool).await?;
        sqlx::query("DELETE FROM tag").execute(pool).await?;

        // Reset auto-increment counters
        sqlx::query("DELETE FROM sqlite_sequence WHERE name IN ('activity_state', 'tag')").execute(pool).await?;

        Ok(())
    }

    /// Seed tags for testing
    pub async fn seed_test_tags(pool: &Pool<Sqlite>) -> Result<()> {
        // Insert tags that will be used in test data
        let tags = vec![
            ("04898e80-6643-4ae9-bfcb-8ce6b8ebaf2e", "creating"),
            ("8a6cc870-4339-4641-9ded-50e9d34b255a", "other_tag"),
            ("e1f75007-59cf-4f4a-a33c-1570742daf2b", "programming"),
            ("cff963a1-655a-4a1a-8d69-10d1367dc742", "communication"),
            ("1150c2f1-5d32-47b9-9175-a703a93c497f", "planning"),
            ("3aeb7eb9-073b-4e62-9442-b5c7db65b654", "research"),
            ("63672549-bb63-492a-87b1-20ff87397bf8", "review"),
            ("882ee9eb-ce03-4221-a265-682913984eb1", "debugging"),
            ("896106c9-c1e3-4379-b498-85e266860866", "testing"),
            ("1f00d5cb-8646-4af6-a363-1ca67e590d14", "meeting"),
        ];

        for (id, name) in tags {
            sqlx::query("INSERT INTO tag (id, name) VALUES (?1, ?2)")
                .bind(id)
                .bind(name)
                .execute(pool)
                .await?;
        }

        Ok(())
    }

    /// Seed activity states for testing based on your example data
    pub async fn seed_test_activity_states(pool: &Pool<Sqlite>) -> Result<()> {
        // Activity states from your dataset - each is 2 minutes long
        let activity_states = vec![
            (109020, "ACTIVE", 3, "2025-09-14T17:24:25.006192Z", "2025-09-14T17:26:25.006192Z"),
            (109019, "ACTIVE", 3, "2025-09-14T17:17:27.71745Z", "2025-09-14T17:19:27.71745Z"),
            (109018, "ACTIVE", 1, "2025-09-14T17:04:47.485032Z", "2025-09-14T17:06:47.485032Z"),
            (109017, "ACTIVE", 5, "2025-09-14T17:02:47.485032Z", "2025-09-14T17:04:47.485032Z"),
            (109016, "ACTIVE", 2, "2025-09-14T16:40:40.685228Z", "2025-09-14T16:42:40.685228Z"),
            (109015, "ACTIVE", 7, "2025-09-14T16:35:33.339528Z", "2025-09-14T16:37:33.339528Z"),
            (109014, "ACTIVE", 2, "2025-09-14T16:31:58.586187Z", "2025-09-14T16:33:58.586187Z"),
            (109013, "ACTIVE", 6, "2025-09-14T16:29:58.586187Z", "2025-09-14T16:31:58.586187Z"),
            (109012, "ACTIVE", 1, "2025-09-14T16:27:58.586187Z", "2025-09-14T16:29:58.586187Z"),
            (109011, "ACTIVE", 0, "2025-09-14T16:25:58.586187Z", "2025-09-14T16:27:58.586187Z"),
            (109010, "ACTIVE", 6, "2025-09-14T16:23:58.586187Z", "2025-09-14T16:25:58.586187Z"),
            (109009, "ACTIVE", 3, "2025-09-14T16:21:58.586187Z", "2025-09-14T16:23:58.586187Z"),
            (109008, "ACTIVE", 3, "2025-09-14T16:19:58.586187Z", "2025-09-14T16:21:58.586187Z"),
            (109007, "ACTIVE", 4, "2025-09-14T16:17:58.586187Z", "2025-09-14T16:19:58.586187Z"),
            (109006, "ACTIVE", 5, "2025-09-14T16:15:58.586187Z", "2025-09-14T16:17:58.586187Z"),
            (109005, "ACTIVE", 4, "2025-09-14T16:13:58.586187Z", "2025-09-14T16:15:58.586187Z"),
            (109004, "ACTIVE", 2, "2025-09-14T16:11:58.586187Z", "2025-09-14T16:13:58.586187Z"),
            // Additional activity states needed for the extended tag data
            (108836, "ACTIVE", 1, "2025-09-14T05:49:16Z", "2025-09-14T05:51:16Z"),
            (108833, "ACTIVE", 2, "2025-09-14T03:12:13Z", "2025-09-14T03:14:13Z"),
            (108832, "ACTIVE", 1, "2025-09-14T02:53:49Z", "2025-09-14T02:55:49Z"),
            (108831, "ACTIVE", 3, "2025-09-14T02:51:49Z", "2025-09-14T02:53:49Z"),
            (108830, "ACTIVE", 1, "2025-09-14T02:49:49Z", "2025-09-14T02:51:49Z"),
            (108829, "ACTIVE", 1, "2025-09-14T02:47:49Z", "2025-09-14T02:49:49Z"),
            (108828, "ACTIVE", 1, "2025-09-14T02:45:49Z", "2025-09-14T02:47:49Z"),
            (108827, "ACTIVE", 3, "2025-09-14T02:43:49Z", "2025-09-14T02:45:49Z"),
            (108826, "ACTIVE", 1, "2025-09-14T02:41:49Z", "2025-09-14T02:43:49Z"),
            (108825, "ACTIVE", 1, "2025-09-14T02:39:49Z", "2025-09-14T02:41:49Z"),
            (108824, "ACTIVE", 1, "2025-09-14T02:37:49Z", "2025-09-14T02:39:49Z"),
            (108823, "ACTIVE", 3, "2025-09-14T02:35:49Z", "2025-09-14T02:37:49Z"),
            (108822, "ACTIVE", 3, "2025-09-14T02:33:49Z", "2025-09-14T02:35:49Z"),
            (108821, "ACTIVE", 3, "2025-09-14T02:31:49Z", "2025-09-14T02:33:49Z"),
            (108820, "ACTIVE", 3, "2025-09-14T02:29:49Z", "2025-09-14T02:31:49Z"),
            (108819, "ACTIVE", 1, "2025-09-14T02:27:49Z", "2025-09-14T02:29:49Z"),
            (108818, "ACTIVE", 3, "2025-09-14T02:25:49Z", "2025-09-14T02:27:49Z"),
            (108817, "ACTIVE", 2, "2025-09-14T02:23:49Z", "2025-09-14T02:25:49Z"),
            (108816, "ACTIVE", 6, "2025-09-14T02:21:49Z", "2025-09-14T02:23:49Z"),
            (108815, "ACTIVE", 8, "2025-09-14T02:19:49Z", "2025-09-14T02:21:49Z"),
            (108814, "ACTIVE", 8, "2025-09-14T02:17:49Z", "2025-09-14T02:19:49Z"),
            (108813, "ACTIVE", 8, "2025-09-14T02:15:49Z", "2025-09-14T02:17:49Z"),
            (108812, "ACTIVE", 2, "2025-09-14T02:13:49Z", "2025-09-14T02:15:49Z"),
            (108811, "ACTIVE", 2, "2025-09-14T02:11:49Z", "2025-09-14T02:13:49Z"),
            (108810, "ACTIVE", 8, "2025-09-14T02:09:49Z", "2025-09-14T02:11:49Z"),
            (108809, "ACTIVE", 8, "2025-09-14T02:07:49Z", "2025-09-14T02:09:49Z"),
            (108808, "ACTIVE", 8, "2025-09-14T02:05:49Z", "2025-09-14T02:07:49Z"),
            (108807, "ACTIVE", 2, "2025-09-14T02:03:49Z", "2025-09-14T02:05:49Z"),
            (108806, "ACTIVE", 8, "2025-09-14T02:01:49Z", "2025-09-14T02:03:49Z"),
            (108805, "ACTIVE", 8, "2025-09-14T01:59:49Z", "2025-09-14T02:01:49Z"),
            (108804, "ACTIVE", 2, "2025-09-14T01:57:49Z", "2025-09-14T01:59:49Z"),
            (108803, "ACTIVE", 2, "2025-09-14T01:55:49Z", "2025-09-14T01:57:49Z"),
            (108802, "ACTIVE", 8, "2025-09-14T01:53:49Z", "2025-09-14T01:55:49Z"),
            (108801, "ACTIVE", 8, "2025-09-14T01:51:49Z", "2025-09-14T01:53:49Z"),
            (108800, "ACTIVE", 8, "2025-09-14T01:49:49Z", "2025-09-14T01:51:49Z"),
            (108799, "ACTIVE", 8, "2025-09-14T01:47:49Z", "2025-09-14T01:49:49Z"),
            (108798, "ACTIVE", 2, "2025-09-14T01:45:49Z", "2025-09-14T01:47:49Z"),
            (108797, "ACTIVE", 2, "2025-09-14T01:43:49Z", "2025-09-14T01:45:49Z"),
            (108796, "ACTIVE", 2, "2025-09-14T01:41:49Z", "2025-09-14T01:43:49Z"),
            (108795, "ACTIVE", 2, "2025-09-14T01:39:49Z", "2025-09-14T01:41:49Z"),
            (108794, "ACTIVE", 2, "2025-09-14T01:37:49Z", "2025-09-14T01:39:49Z"),
            (108793, "ACTIVE", 2, "2025-09-14T01:35:49Z", "2025-09-14T01:37:49Z"),
            (108792, "ACTIVE", 9, "2025-09-14T01:33:49Z", "2025-09-14T01:35:49Z"),
            (108791, "ACTIVE", 2, "2025-09-14T01:31:49Z", "2025-09-14T01:33:49Z"),
            (108790, "ACTIVE", 2, "2025-09-14T01:29:49Z", "2025-09-14T01:31:49Z"),
            (108789, "ACTIVE", 2, "2025-09-14T01:27:49Z", "2025-09-14T01:29:49Z"),
            (108787, "ACTIVE", 2, "2025-09-14T01:23:49Z", "2025-09-14T01:25:49Z"),
            (108786, "ACTIVE", 2, "2025-09-14T01:21:49Z", "2025-09-14T01:23:49Z"),
            (108785, "ACTIVE", 2, "2025-09-14T01:19:49Z", "2025-09-14T01:21:49Z"),
            (108784, "ACTIVE", 2, "2025-09-14T01:17:49Z", "2025-09-14T01:19:49Z"),
            (108783, "ACTIVE", 2, "2025-09-14T01:15:49Z", "2025-09-14T01:17:49Z"),
            (108782, "ACTIVE", 2, "2025-09-14T01:13:49Z", "2025-09-14T01:15:49Z"),
            (108781, "ACTIVE", 2, "2025-09-14T01:11:49Z", "2025-09-14T01:13:49Z"),
            (108780, "ACTIVE", 9, "2025-09-14T01:09:49Z", "2025-09-14T01:11:49Z"),
            (108779, "ACTIVE", 2, "2025-09-14T01:07:49Z", "2025-09-14T01:09:49Z"),
            (108778, "ACTIVE", 2, "2025-09-14T01:05:49Z", "2025-09-14T01:07:49Z"),
            (108777, "ACTIVE", 2, "2025-09-14T01:03:49Z", "2025-09-14T01:05:49Z"),
            (108776, "ACTIVE", 2, "2025-09-14T01:01:49Z", "2025-09-14T01:03:49Z"),
            (108775, "ACTIVE", 2, "2025-09-14T00:59:49Z", "2025-09-14T01:01:49Z"),
            (108774, "ACTIVE", 2, "2025-09-14T00:57:49Z", "2025-09-14T00:59:49Z"),
            (108773, "ACTIVE", 2, "2025-09-14T00:55:49Z", "2025-09-14T00:57:49Z"),
            (108772, "ACTIVE", 2, "2025-09-14T00:53:49Z", "2025-09-14T00:55:49Z"),
            (108771, "ACTIVE", 2, "2025-09-14T00:51:49Z", "2025-09-14T00:53:49Z"),
            (108770, "ACTIVE", 2, "2025-09-14T00:49:49Z", "2025-09-14T00:51:49Z"),
            (108769, "ACTIVE", 2, "2025-09-14T00:47:49Z", "2025-09-14T00:49:49Z"),
            (108764, "ACTIVE", 10, "2025-09-14T00:37:49Z", "2025-09-14T00:39:49Z"),
            (108763, "ACTIVE", 10, "2025-09-14T00:35:49Z", "2025-09-14T00:37:49Z"),
            (108762, "ACTIVE", 4, "2025-09-14T00:33:49Z", "2025-09-14T00:35:49Z"),
        ];

        for (id, state, activity_type, start_time, end_time) in activity_states {
            sqlx::query(
                "INSERT INTO activity_state (id, state, activity_type, start_time, end_time, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?5)"
            )
            .bind(id)
            .bind(state)
            .bind(activity_type)
            .bind(start_time)
            .bind(end_time)
            .execute(pool)
            .await?;
        }

        Ok(())
    }

    /// Seed activity state tags for testing - complete dataset from your example
    pub async fn seed_test_activity_state_tags(pool: &Pool<Sqlite>) -> Result<()> {
        // Complete activity state tags from your dataset
        let tags = vec![
            (109020, "04898e80-6643-4ae9-bfcb-8ce6b8ebaf2e"), // creating
            (109019, "04898e80-6643-4ae9-bfcb-8ce6b8ebaf2e"), // creating
            (109018, "8a6cc870-4339-4641-9ded-50e9d34b255a"), // other_tag
            (109017, "04898e80-6643-4ae9-bfcb-8ce6b8ebaf2e"), // creating
            (109016, "04898e80-6643-4ae9-bfcb-8ce6b8ebaf2e"), // creating
            (109015, "04898e80-6643-4ae9-bfcb-8ce6b8ebaf2e"), // creating
            (109014, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (109013, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (109012, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (109011, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (109010, "cff963a1-655a-4a1a-8d69-10d1367dc742"), // communication
            (109009, "cff963a1-655a-4a1a-8d69-10d1367dc742"), // communication
            (109008, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (109004, "1150c2f1-5d32-47b9-9175-a703a93c497f"), // planning
            (108836, "1150c2f1-5d32-47b9-9175-a703a93c497f"), // planning
            (108833, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108832, "1150c2f1-5d32-47b9-9175-a703a93c497f"), // planning
            (108831, "3aeb7eb9-073b-4e62-9442-b5c7db65b654"), // research
            (108830, "1150c2f1-5d32-47b9-9175-a703a93c497f"), // planning
            (108829, "1150c2f1-5d32-47b9-9175-a703a93c497f"), // planning
            (108828, "1150c2f1-5d32-47b9-9175-a703a93c497f"), // planning
            (108827, "3aeb7eb9-073b-4e62-9442-b5c7db65b654"), // research
            (108826, "1150c2f1-5d32-47b9-9175-a703a93c497f"), // planning
            (108825, "1150c2f1-5d32-47b9-9175-a703a93c497f"), // planning
            (108824, "1150c2f1-5d32-47b9-9175-a703a93c497f"), // planning
            (108823, "3aeb7eb9-073b-4e62-9442-b5c7db65b654"), // research
            (108822, "3aeb7eb9-073b-4e62-9442-b5c7db65b654"), // research
            (108821, "3aeb7eb9-073b-4e62-9442-b5c7db65b654"), // research
            (108820, "3aeb7eb9-073b-4e62-9442-b5c7db65b654"), // research
            (108819, "1150c2f1-5d32-47b9-9175-a703a93c497f"), // planning
            (108818, "3aeb7eb9-073b-4e62-9442-b5c7db65b654"), // research
            (108817, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108816, "63672549-bb63-492a-87b1-20ff87397bf8"), // review
            (108815, "882ee9eb-ce03-4221-a265-682913984eb1"), // debugging
            (108814, "882ee9eb-ce03-4221-a265-682913984eb1"), // debugging
            (108813, "882ee9eb-ce03-4221-a265-682913984eb1"), // debugging
            (108812, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108811, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108810, "882ee9eb-ce03-4221-a265-682913984eb1"), // debugging
            (108809, "882ee9eb-ce03-4221-a265-682913984eb1"), // debugging
            (108808, "882ee9eb-ce03-4221-a265-682913984eb1"), // debugging
            (108807, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108806, "882ee9eb-ce03-4221-a265-682913984eb1"), // debugging
            (108805, "882ee9eb-ce03-4221-a265-682913984eb1"), // debugging
            (108804, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108803, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108802, "882ee9eb-ce03-4221-a265-682913984eb1"), // debugging
            (108801, "882ee9eb-ce03-4221-a265-682913984eb1"), // debugging
            (108800, "882ee9eb-ce03-4221-a265-682913984eb1"), // debugging
            (108799, "882ee9eb-ce03-4221-a265-682913984eb1"), // debugging
            (108798, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108797, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108796, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108795, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108794, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108793, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108792, "896106c9-c1e3-4379-b498-85e266860866"), // testing
            (108791, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108790, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108789, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108787, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108786, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108785, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108784, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108783, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108782, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108781, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108780, "896106c9-c1e3-4379-b498-85e266860866"), // testing
            (108779, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108778, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108777, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108776, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108775, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108774, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108773, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108772, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108771, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108770, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108769, "e1f75007-59cf-4f4a-a33c-1570742daf2b"), // programming
            (108764, "1f00d5cb-8646-4af6-a363-1ca67e590d14"), // meeting
            (108763, "1f00d5cb-8646-4af6-a363-1ca67e590d14"), // meeting
            (108762, "cff963a1-655a-4a1a-8d69-10d1367dc742"), // communication
        ];

        for (activity_state_id, tag_id) in tags {
            sqlx::query(
                "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at)
                 VALUES (?1, ?2, datetime('now'), datetime('now'))"
            )
            .bind(activity_state_id)
            .bind(tag_id)
            .execute(pool)
            .await?;
        }

        Ok(())
    }
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;
    use time::macros::datetime;
    use crate::db_manager;

    /// Create just the tables we need for testing
    async fn create_test_tables(pool: &Pool<Sqlite>) -> Result<()> {
        // Create the minimal tables needed for our tests
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS tag (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL
            )"
        ).execute(pool).await?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS activity_state (
                id INTEGER PRIMARY KEY,
                state TEXT NOT NULL,
                activity_type INTEGER NOT NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME,
                created_at DATETIME NOT NULL
            )"
        ).execute(pool).await?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS activity_state_tag (
                activity_state_id INTEGER NOT NULL,
                tag_id TEXT NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                PRIMARY KEY (activity_state_id, tag_id),
                FOREIGN KEY (activity_state_id) REFERENCES activity_state (id),
                FOREIGN KEY (tag_id) REFERENCES tag (id)
            )"
        ).execute(pool).await?;

        Ok(())
    }

    /// Setup test database with clean data and seeding
    async fn setup_test_repo() -> Result<ActivityStateRepo> {
        let pool = db_manager::create_test_db().await;

        // Create required tables
        create_test_tables(&pool).await?;

        // Clean and seed test data
        cleanup_activity_state_data(&pool).await?;
        seed_test_tags(&pool).await?;
        seed_test_activity_states(&pool).await?;
        seed_test_activity_state_tags(&pool).await?;

        Ok(ActivityStateRepo::new(pool))
    }

    #[tokio::test]
    async fn test_calculate_tagged_duration_in_range_creating_tag() -> Result<()> {
        let repo = setup_test_repo().await?;

        // Test "creating" tag for a specific time range that should capture multiple activities
        // From your dataset, "creating" activities:
        // 109020 - 17:24:25 to 17:26:25 (2 min)
        // 109019 - 17:17:27 to 17:19:27 (2 min)
        // 109017 - 17:02:47 to 17:04:47 (2 min)
        // 109016 - 16:40:40 to 16:42:40 (2 min)
        // 109015 - 16:35:33 to 16:37:33 (2 min)
        // Total expected: 10 minutes

        let start_time = datetime!(2025-09-14 16:30:00 UTC);
        let end_time = datetime!(2025-09-14 17:30:00 UTC);

        // Also call debug function to see details
        repo.debug_get_tagged_activity_states("creating", start_time, end_time).await?;

        let total_minutes = repo.calculate_tagged_duration_in_range("creating", start_time, end_time).await?;

        println!("=== TEST RESULTS ===");
        println!("Expected: 10.0 minutes for 'creating' tag in range {} to {}", start_time, end_time);
        println!("Actual: {} minutes", total_minutes);
        println!("====================");

        // Should be 10 minutes (5 activities × 2 minutes each) - allow for floating point precision
        assert!((total_minutes - 10.0).abs() < 0.01, "Should have approximately 10 minutes of 'creating' activity, got {}", total_minutes);

        Ok(())
    }

    #[tokio::test]
    async fn test_calculate_tagged_duration_in_range_full_day() -> Result<()> {
        let repo = setup_test_repo().await?;

        // Test the full day for "creating" tag
        // All "creating" activities in the dataset:
        // 109020, 109019, 109017, 109016, 109015 = 5 activities × 2 minutes = 10 minutes

        let start_time = datetime!(2025-09-14 00:00:00 UTC);
        let end_time = datetime!(2025-09-15 00:00:00 UTC);

        repo.debug_get_tagged_activity_states("creating", start_time, end_time).await?;

        let total_minutes = repo.calculate_tagged_duration_in_range("creating", start_time, end_time).await?;

        println!("=== FULL DAY TEST ===");
        println!("Expected: 10.0 minutes for 'creating' tag for full day");
        println!("Actual: {} minutes", total_minutes);
        println!("=====================");

        assert_eq!(total_minutes, 10.0, "Should have exactly 10 minutes of 'creating' activity for the full day");

        Ok(())
    }

    #[tokio::test]
    async fn test_calculate_tagged_duration_programming_vs_creating() -> Result<()> {
        let repo = setup_test_repo().await?;

        let start_time = datetime!(2025-09-14 00:00:00 UTC);
        let end_time = datetime!(2025-09-15 00:00:00 UTC);

        // Calculate for different tags to verify the distinction
        let creating_minutes = repo.calculate_tagged_duration_in_range("creating", start_time, end_time).await?;
        let programming_minutes = repo.calculate_tagged_duration_in_range("programming", start_time, end_time).await?;

        repo.debug_get_tagged_activity_states("creating", start_time, end_time).await?;
        repo.debug_get_tagged_activity_states("programming", start_time, end_time).await?;

        println!("=== TAG COMPARISON ===");
        println!("Creating minutes: {}", creating_minutes);
        println!("Programming minutes: {}", programming_minutes);
        println!("======================");

        // Programming should have way more entries than creating in your dataset
        assert!(programming_minutes > creating_minutes, "Programming should have more minutes than creating");
        assert_eq!(creating_minutes, 10.0, "Creating should be exactly 10 minutes");

        Ok(())
    }

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

        // Create an activity state with the wrong tag (shouldn't be counted)
        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at) 
             VALUES (4, 'ACTIVE', 0, ?1, ?2, ?3)"
        )
        .bind(start_time)
        .bind(mid_time)
        .bind(now)
        .execute(&pool)
        .await?;

        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at) 
             VALUES ('4', ?1, ?2, ?3)"
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