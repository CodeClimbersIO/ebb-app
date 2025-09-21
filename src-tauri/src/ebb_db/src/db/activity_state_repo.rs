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
    /// Uses application-side aggregation for better performance
    pub async fn calculate_tagged_duration_in_range(
        &self,
        tag_name: &str,
        start_time: OffsetDateTime,
        end_time: OffsetDateTime,
    ) -> Result<f64> {
        let function_start = std::time::Instant::now();
        log::debug!("Calculating tagged duration for tag '{}' from {} to {}", tag_name, start_time, end_time);

        // First, get the tag_type for the requested tag_name
        let query_start = std::time::Instant::now();
        let tag_type: Option<String> = sqlx::query_scalar(
            "SELECT tag_type FROM tag WHERE name = ?1"
        )
        .bind(tag_name)
        .fetch_optional(&self.pool)
        .await?;
        let tag_type_query_duration = query_start.elapsed();
        println!("Tag type query took: {:?}", tag_type_query_duration);

        let tag_type = match tag_type {
            Some(t) => t,
            None => return Ok(0.0), // Tag doesn't exist, return 0
        };

        // Fetch all relevant activity state data in a single query
        #[derive(Debug)]
        struct ActivityStateData {
            id: i64,
            start_time: OffsetDateTime,
            end_time: OffsetDateTime,
            tag_name: String,
            tag_type: String,
        }

        let main_query_start = std::time::Instant::now();
        let raw_data: Vec<(i64, OffsetDateTime, OffsetDateTime, String, String)> = sqlx::query_as(
            "SELECT
                activity_state.id,
                activity_state.start_time,
                activity_state.end_time,
                tag.name as tag_name,
                tag.tag_type
            FROM activity_state
            JOIN activity_state_tag ON activity_state.id = activity_state_tag.activity_state_id
            JOIN tag ON activity_state_tag.tag_id = tag.id
            WHERE activity_state.start_time < ?1
              AND activity_state.end_time > ?2
            ORDER BY activity_state.id"
        )
        .bind(end_time)
        .bind(start_time)
        .fetch_all(&self.pool)
        .await?;
        let main_query_duration = main_query_start.elapsed();
        println!("Main data query took: {:?} and returned {} records", main_query_duration, raw_data.len());

        // Convert to structured data
        let processing_start = std::time::Instant::now();
        let activity_data: Vec<ActivityStateData> = raw_data
            .into_iter()
            .map(|(id, start, end, tag_name, tag_type)| ActivityStateData {
                id,
                start_time: start,
                end_time: end,
                tag_name,
                tag_type,
            })
            .collect();
        let data_conversion_duration = processing_start.elapsed();
        println!("Data conversion took: {:?}", data_conversion_duration);

        // Group by activity_state_id and calculate tag counts per tag_type
        use std::collections::HashMap;

        let mut activity_states: HashMap<i64, (OffsetDateTime, OffsetDateTime, HashMap<String, i32>)> = HashMap::new();
        let mut target_tag_records: Vec<i64> = Vec::new(); // Each record for the target tag

        for data in activity_data {
            let entry = activity_states.entry(data.id).or_insert_with(|| {
                (data.start_time, data.end_time, HashMap::new())
            });

            // Count tags by tag_type (each record counts as one tag)
            *entry.2.entry(data.tag_type.clone()).or_insert(0) += 1;

            // Track each individual record that has our target tag
            if data.tag_name == tag_name {
                target_tag_records.push(data.id);
            }
        }

        // print out activity_states
        println!("Activity states: {:?}", activity_states);

        // print out target_tag_records
        println!("Target tag records: {:?}", target_tag_records);

        // Calculate the total duration
        let mut total_minutes = 0.0;
        let target_record_count = target_tag_records.len();

        // For each record of the target tag, calculate its contribution
        for activity_state_id in &target_tag_records {
            if let Some((activity_start, activity_end, tag_counts)) = activity_states.get(&activity_state_id) {
                // Calculate the overlapping duration for this activity state
                let effective_start = if *activity_start < start_time { start_time } else { *activity_start };
                let effective_end = if *activity_end > end_time { end_time } else { *activity_end };

                // Skip if there's no actual overlap (effective_end <= effective_start)
                if effective_end <= effective_start {
                    println!("Skipping activity state {} - no overlap: effective range {} to {}",
                        activity_state_id, effective_start, effective_end);
                    continue;
                }

                let duration_minutes = (effective_end - effective_start).whole_minutes() as f64;

                // Get the count of tags for the target tag_type
                let tag_count = tag_counts.get(&tag_type).unwrap_or(&0);

                if *tag_count > 0 {
                    // Each individual record gets: duration / total_tags_of_same_type
                    let split_minutes = duration_minutes / (*tag_count as f64);
                    total_minutes += split_minutes;

                    println!("State {} record: {:.2} minutes ÷ {} tags = {:.2} minutes",
                        activity_state_id, duration_minutes, tag_count, split_minutes);
                }
            }
        }

        let total_function_duration = function_start.elapsed();

        println!("=== APPLICATION-SIDE CALCULATION ===");
        println!("Target tag: '{}' (type: '{}')", tag_name, tag_type);
        println!("Time range: {} to {}", start_time, end_time);
        println!("Processed {} activity states", activity_states.len());
        println!("Found {} records with target tag", target_record_count);
        println!("Total minutes: {:.2}", total_minutes);
        println!("TOTAL FUNCTION TIME: {:?}", total_function_duration);
        println!("=====================================");

        Ok(total_minutes)
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
    use time::macros::datetime;
    use crate::db_manager;
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
            // Default type tags (for productivity tracking)
            ("creating-tag-id", "creating", "default"),
            ("consuming-tag-id", "consuming", "default"),
            ("neutral-tag-id", "neutral", "default"),
            ("idle-tag-id", "idle", "default"),
            // Category type tags (for activity categorization)
            ("coding-tag-id", "coding", "category"),
            ("browsing-tag-id", "browsing", "category"),
            ("writing-tag-id", "writing", "category"),
            ("meeting-tag-id", "meeting", "category"),
        ];

        for (id, name, tag_type) in tags {
            sqlx::query("INSERT INTO tag (id, name, tag_type) VALUES (?1, ?2, ?3)")
                .bind(id)
                .bind(name)
                .bind(tag_type)
                .execute(pool)
                .await?;
        }

        Ok(())
    }


    /// Create just the tables we need for testing
    async fn create_test_tables(pool: &Pool<Sqlite>) -> Result<()> {
        // Create the minimal tables needed for our tests
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS tag (
                id TEXT PRIMARY KEY NOT NULL,
                tag_type TEXT NOT NULL,
                name TEXT NOT NULL
            )"
        ).execute(pool).await?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS activity_state (
                id INTEGER PRIMARY KEY,
                state TEXT NOT NULL,
                app_switches INTEGER,
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
                app_tag_id TEXT,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                PRIMARY KEY (activity_state_id, tag_id, app_tag_id),
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

        Ok(ActivityStateRepo::new(pool))
    }

    // ===== CALCULATE_TAGGED_DURATION_IN_RANGE TESTS =====
    // Test suite for time calculation with proper tag time splitting

    #[tokio::test]
    async fn test_calculate_tagged_duration_single_activity_state_no_tags() -> Result<()> {
        let repo = setup_test_repo().await?;

        // Test 1-hour period with one activity state that has no tags
        // Should return 0 minutes for any tag query since activity has no tags

        // Create a custom activity state with no tags for this test
        let pool = &repo.pool;
        let test_start = datetime!(2025-01-01 10:00:00 UTC);
        let test_end = datetime!(2025-01-01 11:00:00 UTC); // 1 hour duration

        // Insert activity state without any tags
        sqlx::query(
            "INSERT INTO activity_state (id, state, activity_type, start_time, end_time, created_at)
             VALUES (999001, 'ACTIVE', 1, ?1, ?2, ?3)"
        )
        .bind(test_start)
        .bind(test_end)
        .bind(test_start)
        .execute(pool)
        .await?;

        // Query for any tag name and expect 0 minutes since this activity has no tags
        let query_start = datetime!(2025-01-01 09:00:00 UTC);
        let query_end = datetime!(2025-01-01 12:00:00 UTC);

        let creating_minutes = repo.calculate_tagged_duration_in_range("creating", query_start, query_end).await?;
        let idle_minutes = repo.calculate_tagged_duration_in_range("idle", query_start, query_end).await?;
        let neutral_minutes = repo.calculate_tagged_duration_in_range("neutral", query_start, query_end).await?;

        // All should return 0 since the activity state has no tags
        assert_eq!(creating_minutes, 0.0, "Activity with no tags should contribute 0 minutes to 'creating'");
        assert_eq!(idle_minutes, 0.0, "Activity with no tags should contribute 0 minutes to 'idle'");
        assert_eq!(neutral_minutes, 0.0, "Activity with no tags should contribute 0 minutes to 'neutral'");

        Ok(())
    }

    #[tokio::test]
    async fn test_calculate_tagged_duration_single_activity_state_one_tag() -> Result<()> {
        let repo = setup_test_repo().await?;

        // Test 1-hour period with one activity state that has exactly 1 tag
        // Should return full 60 minutes for that tag, 0 for others

        // Create a custom activity state with exactly 1 tag for this test
        let pool = &repo.pool;
        let test_start = datetime!(2025-01-02 10:00:00 UTC);
        let test_end = datetime!(2025-01-02 11:00:00 UTC); // 1 hour duration

        // Insert activity state with exactly one tag
        sqlx::query(
            "INSERT INTO activity_state (id, state, activity_type, start_time, end_time, created_at)
             VALUES (999002, 'ACTIVE', 1, ?1, ?2, ?3)"
        )
        .bind(test_start)
        .bind(test_end)
        .bind(test_start)
        .execute(pool)
        .await?;

        // Link to exactly one tag: "creating"
        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, app_tag_id, created_at, updated_at)
             VALUES (999002, 'creating-tag-id', NULL, datetime('now'), datetime('now'))"
        )
        .execute(pool)
        .await?;

        // Query range that encompasses our test activity
        let query_start = datetime!(2025-01-02 09:00:00 UTC);
        let query_end = datetime!(2025-01-02 12:00:00 UTC);

        // Query for "creating" - should get full 60 minutes
        let creating_minutes = repo.calculate_tagged_duration_in_range("creating", query_start, query_end).await?;

        // Query for other tags - should get 0 minutes
        let idle_minutes = repo.calculate_tagged_duration_in_range("idle", query_start, query_end).await?;
        let neutral_minutes = repo.calculate_tagged_duration_in_range("neutral", query_start, query_end).await?;

        // Assertions
        assert_eq!(creating_minutes, 60.0, "Activity with 1 'creating' tag should contribute full 60 minutes to 'creating'");
        assert_eq!(idle_minutes, 0.0, "Activity with only 'creating' tag should contribute 0 minutes to 'idle'");
        assert_eq!(neutral_minutes, 0.0, "Activity with only 'creating' tag should contribute 0 minutes to 'neutral'");

        Ok(())
    }

    #[tokio::test]
    async fn test_calculate_tagged_duration_single_activity_state_multiple_tags() -> Result<()> {
        let repo = setup_test_repo().await?;

        // Test 1-hour period with one activity state that has multiple tags
        // Should split the 60 minutes evenly between all tags

        // Create a custom activity state with exactly 3 tags for this test
        let pool = &repo.pool;
        let test_start = datetime!(2025-01-03 10:00:00 UTC);
        let test_end = datetime!(2025-01-03 11:00:00 UTC); // 1 hour duration

        // Insert activity state with multiple tags
        sqlx::query(
            "INSERT INTO activity_state (id, state, activity_type, start_time, end_time, created_at)
             VALUES (999003, 'ACTIVE', 1, ?1, ?2, ?3)"
        )
        .bind(test_start)
        .bind(test_end)
        .bind(test_start)
        .execute(pool)
        .await?;

        // Link to exactly 3 tags: "creating", "consuming", "neutral"
        let tags = [
            ("creating-tag-id", "creating"),
            ("consuming-tag-id", "consuming"),
            ("neutral-tag-id", "neutral")
        ];

        for (tag_id, _tag_name) in tags {
            sqlx::query(
                "INSERT INTO activity_state_tag (activity_state_id, tag_id, app_tag_id, created_at, updated_at)
                 VALUES (999003, ?1, NULL, datetime('now'), datetime('now'))"
            )
            .bind(tag_id)
            .execute(pool)
            .await?;
        }

        // Query range that encompasses our test activity
        let query_start = datetime!(2025-01-03 09:00:00 UTC);
        let query_end = datetime!(2025-01-03 12:00:00 UTC);

        // Query for each of the 3 tags - should get 20 minutes each (60/3)
        let creating_minutes = repo.calculate_tagged_duration_in_range("creating", query_start, query_end).await?;
        let consuming_minutes = repo.calculate_tagged_duration_in_range("consuming", query_start, query_end).await?;
        let neutral_minutes = repo.calculate_tagged_duration_in_range("neutral", query_start, query_end).await?;

        // Query for tag not on this activity - should get 0 minutes
        let idle_minutes = repo.calculate_tagged_duration_in_range("idle", query_start, query_end).await?;

        // Assertions - each of the 3 tags should get 20 minutes (60/3)
        assert_eq!(creating_minutes, 20.0, "Activity with 3 tags should contribute 20 minutes (60/3) to 'creating'");
        assert_eq!(consuming_minutes, 20.0, "Activity with 3 tags should contribute 20 minutes (60/3) to 'consuming'");
        assert_eq!(neutral_minutes, 20.0, "Activity with 3 tags should contribute 20 minutes (60/3) to 'neutral'");
        assert_eq!(idle_minutes, 0.0, "Activity without 'idle' tag should contribute 0 minutes to 'idle'");

        // Verify total adds up correctly
        let total = creating_minutes + consuming_minutes + neutral_minutes;
        assert_eq!(total, 60.0, "Sum of all tag times should equal original duration");

        Ok(())
    }

    #[tokio::test]
    async fn test_calculate_tagged_duration_multiple_activity_states_mixed_tagging() -> Result<()> {
        let repo = setup_test_repo().await?;

        // Test 1-hour period with multiple activity states having different tag configurations
        // Should sum up times correctly across all activity states

        let pool = &repo.pool;
        let base_time = datetime!(2025-01-04 10:00:00 UTC);

        // Create 4 activity states, each 15 minutes long (total 1 hour)
        let activity_states = [
            (999011, 0),  // 10:00-10:15 - no tags
            (999012, 15), // 10:15-10:30 - 1 tag "creating"
            (999013, 30), // 10:30-10:45 - 2 tags "creating" + "neutral"
            (999014, 45), // 10:45-11:00 - 3 tags "creating" + "consuming" + "neutral"
        ];

        // Insert activity states (each 15 minutes)
        for (id, offset_minutes) in activity_states {
            let start = base_time + time::Duration::minutes(offset_minutes);
            let end = start + time::Duration::minutes(15);

            sqlx::query(
                "INSERT INTO activity_state (id, state, activity_type, start_time, end_time, created_at)
                 VALUES (?1, 'ACTIVE', 1, ?2, ?3, ?4)"
            )
            .bind(id)
            .bind(start)
            .bind(end)
            .bind(start)
            .execute(pool)
            .await?;
        }

        // Activity state 1 (999011): no tags - contributes 0 to any tag

        // Activity state 2 (999012): 1 tag "creating" - contributes full 15 minutes to "creating"
        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, app_tag_id, created_at, updated_at)
             VALUES (999012, 'creating-tag-id', NULL, datetime('now'), datetime('now'))"
        )
        .execute(pool)
        .await?;

        // Activity state 3 (999013): 2 tags "creating" + "neutral" - contributes 7.5 minutes to each
        let tags_state_3 = ["creating-tag-id", "neutral-tag-id"];
        for tag_id in tags_state_3 {
            sqlx::query(
                "INSERT INTO activity_state_tag (activity_state_id, tag_id, app_tag_id, created_at, updated_at)
                 VALUES (999013, ?1, NULL, datetime('now'), datetime('now'))"
            )
            .bind(tag_id)
            .execute(pool)
            .await?;
        }

        // Activity state 4 (999014): 3 tags "creating" + "consuming" + "neutral" - contributes 5 minutes to each
        let tags_state_4 = ["creating-tag-id", "consuming-tag-id", "neutral-tag-id"];
        for tag_id in tags_state_4 {
            sqlx::query(
                "INSERT INTO activity_state_tag (activity_state_id, tag_id, app_tag_id, created_at, updated_at)
                 VALUES (999014, ?1, NULL, datetime('now'), datetime('now'))"
            )
            .bind(tag_id)
            .execute(pool)
            .await?;
        }

        // Query range that encompasses all test activities
        let query_start = datetime!(2025-01-04 09:00:00 UTC);
        let query_end = datetime!(2025-01-04 12:00:00 UTC);

        // Query for each tag and verify expected summation
        let creating_minutes = repo.calculate_tagged_duration_in_range("creating", query_start, query_end).await?;
        let neutral_minutes = repo.calculate_tagged_duration_in_range("neutral", query_start, query_end).await?;
        let consuming_minutes = repo.calculate_tagged_duration_in_range("consuming", query_start, query_end).await?;
        let idle_minutes = repo.calculate_tagged_duration_in_range("idle", query_start, query_end).await?;

        // Expected calculations (accounting for SQLite ROUND behavior with banker's rounding):
        // "creating":
        //   - State 1: 0 minutes (no tags)
        //   - State 2: 15 minutes (1 tag, gets full 15)
        //   - State 3: 7 minutes (2 tags, gets ROUND(15/2) = ROUND(7.5) = 8, but banker's rounding gives 7)
        //   - State 4: 5 minutes (3 tags, gets ROUND(15/3) = ROUND(5.0) = 5)
        //   - Total: 0 + 15 + 7 + 5 = 27 minutes
        assert_eq!(creating_minutes, 27.5, "Creating should get sum from states 2, 3, and 4: 15 + 7.5 + 5 = 27.5 (application-side precision)");

        // "neutral":
        //   - State 1: 0 minutes (no tags)
        //   - State 2: 0 minutes (doesn't have neutral tag)
        //   - State 3: 7.5 minutes (2 tags, gets 15/2 = 7.5)
        //   - State 4: 5 minutes (3 tags, gets 15/3 = 5)
        //   - Total: 0 + 0 + 7.5 + 5 = 12.5 minutes
        assert_eq!(neutral_minutes, 12.5, "Neutral should get sum from states 3 and 4: 7.5 + 5 = 12.5 (application-side precision)");

        // "consuming":
        //   - State 1: 0 minutes (no tags)
        //   - State 2: 0 minutes (doesn't have consuming tag)
        //   - State 3: 0 minutes (doesn't have consuming tag)
        //   - State 4: 5 minutes (3 tags, gets 15/3)
        //   - Total: 0 + 0 + 0 + 5 = 5 minutes
        assert_eq!(consuming_minutes, 5.0, "Consuming should get sum from state 4 only: 5");

        // "idle":
        //   - No activity states have idle tag
        //   - Total: 0 minutes
        assert_eq!(idle_minutes, 0.0, "Idle should get 0 minutes as no activity states have idle tag");

        // Verify that the original 60 minutes is properly distributed
        // Note: Time can be counted multiple times across different tags for the same activity
        // State 2: 15 minutes goes only to "creating"
        // State 3: 15 minutes split between "creating" (7.5) and "neutral" (7.5) = 15 total
        // State 4: 15 minutes split between "creating" (5), "consuming" (5), "neutral" (5) = 15 total
        // This confirms time is properly split, not duplicated

        println!("=== MIXED TAGGING TEST RESULTS ===");
        println!("Creating: {} minutes (expected 27.5)", creating_minutes);
        println!("Neutral: {} minutes (expected 12.5)", neutral_minutes);
        println!("Consuming: {} minutes (expected 5.0)", consuming_minutes);
        println!("Idle: {} minutes (expected 0.0)", idle_minutes);
        println!("===================================");

        Ok(())
    }

    #[tokio::test]
    async fn test_calculate_tagged_duration_time_range_clipping() -> Result<()> {
        let repo = setup_test_repo().await?;

        // Test that activity states are properly clipped to the queried time range
        // Only the overlapping portion should contribute to the total

        // Create custom test data for clipping scenarios
        let pool = &repo.pool;

        // Create test activity states with specific times for clipping tests
        // State A: 10:00-11:00 (1 hour, "creating" tag)
        // State B: 10:30-11:30 (1 hour, "creating" + "neutral" tags)
        let state_a_start = datetime!(2025-01-05 10:00:00 UTC);
        let state_a_end = datetime!(2025-01-05 11:00:00 UTC);
        let state_b_start = datetime!(2025-01-05 10:30:00 UTC);
        let state_b_end = datetime!(2025-01-05 11:30:00 UTC);

        // Insert State A (1 tag: creating)
        sqlx::query(
            "INSERT INTO activity_state (id, state, activity_type, start_time, end_time, created_at)
             VALUES (999100, 'ACTIVE', 1, ?1, ?2, ?3)"
        )
        .bind(state_a_start)
        .bind(state_a_end)
        .bind(state_a_start)
        .execute(pool)
        .await?;

        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, app_tag_id, created_at, updated_at)
             VALUES (999100, 'creating-tag-id', NULL, datetime('now'), datetime('now'))"
        )
        .execute(pool)
        .await?;

        // Insert State B (2 tags: creating + neutral)
        sqlx::query(
            "INSERT INTO activity_state (id, state, activity_type, start_time, end_time, created_at)
             VALUES (999101, 'ACTIVE', 1, ?1, ?2, ?3)"
        )
        .bind(state_b_start)
        .bind(state_b_end)
        .bind(state_b_start)
        .execute(pool)
        .await?;

        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, app_tag_id, created_at, updated_at)
             VALUES (999101, 'creating-tag-id', NULL, datetime('now'), datetime('now')),
                    (999101, 'neutral-tag-id', NULL, datetime('now'), datetime('now'))"
        )
        .execute(pool)
        .await?;

        // Scenario 1: Query starts before State A and ends during State A
        // Query 9:30-10:30 should overlap with State A for 10:00-10:30 = 30 minutes
        let clip_start_result = repo.calculate_tagged_duration_in_range(
            "creating",
            datetime!(2025-01-05 9:30:00 UTC),
            datetime!(2025-01-05 10:30:00 UTC),
        ).await?;
        assert_eq!(clip_start_result, 30.0, "Query 9:30-10:30 should clip State A to get 30 minutes for creating");

        // Scenario 2: Query starts during State A and ends after State A
        // Query 10:45-11:15 should overlap with:
        // - State A: 10:45-11:00 = 15 minutes (1 tag, gets full 15 minutes)
        // - State B: 10:45-11:15 = 30 minutes (2 tags, gets 30/2 = 15 minutes)
        // Expected: 15 + 15 = 30 minutes
        let clip_end_result = repo.calculate_tagged_duration_in_range(
            "creating",
            datetime!(2025-01-05 10:45:00 UTC),
            datetime!(2025-01-05 11:15:00 UTC),
        ).await?;
        assert_eq!(clip_end_result, 30.0, "Query 10:45-11:15 should clip states to get 30 minutes for creating");

        // Scenario 3: Query fully contains State A
        // Query 9:30-11:30 should overlap with:
        // - State A: 10:00-11:00 = 60 minutes (1 tag, gets full 60 minutes)
        // - State B: 10:30-11:30 = 60 minutes (2 tags, gets 60/2 = 30 minutes)
        // Expected: 60 + 30 = 90 minutes
        let fully_contains_result = repo.calculate_tagged_duration_in_range(
            "creating",
            datetime!(2025-01-05 9:30:00 UTC),
            datetime!(2025-01-05 11:30:00 UTC),
        ).await?;
        assert_eq!(fully_contains_result, 90.0, "Query 9:30-11:30 should fully contain states and get 90 minutes for creating");

        // Scenario 4: Query range overlaps with both states
        // Query 10:15-10:45 should overlap with:
        // - State A: 10:15-10:45 = 30 minutes (1 tag, gets full 30 minutes)
        // - State B: 10:30-10:45 = 15 minutes (2 tags, gets 15/2 = 7.5 minutes, rounded to 8)
        // Expected: 30 + 8 = 38 minutes
        let overlapping_states_result = repo.calculate_tagged_duration_in_range(
            "creating",
            datetime!(2025-01-05 10:15:00 UTC),
            datetime!(2025-01-05 10:45:00 UTC),
        ).await?;
        assert_eq!(overlapping_states_result, 37.5, "Query 10:15-10:45 overlapping both states should get 37.5 minutes for creating");

        Ok(())
    }

    #[tokio::test]
    async fn test_calculate_tagged_duration_empty_result() -> Result<()> {
        let repo = setup_test_repo().await?;

        // Test scenarios that should return 0 minutes

        // Scenario 1: Query for tag that doesn't exist on any activity states
        let nonexistent_tag_result = repo.calculate_tagged_duration_in_range(
            "nonexistent_tag",
            datetime!(2025-01-04 9:00:00.0 +00:00:00),
            datetime!(2025-01-04 12:00:00.0 +00:00:00),
        ).await?;
        assert_eq!(nonexistent_tag_result, 0.0, "Nonexistent tag should return 0 minutes");

        // Scenario 2: Query for time range completely outside all activity states (before)
        let before_range_result = repo.calculate_tagged_duration_in_range(
            "creating",
            datetime!(2025-01-04 6:00:00.0 +00:00:00),  // 6:00-7:00 (before our 9:00-12:00 data)
            datetime!(2025-01-04 7:00:00.0 +00:00:00),
        ).await?;
        assert_eq!(before_range_result, 0.0, "Time range before all activity states should return 0 minutes");

        // Scenario 3: Query for time range completely outside all activity states (after)
        let after_range_result = repo.calculate_tagged_duration_in_range(
            "creating",
            datetime!(2025-01-04 15:00:00.0 +00:00:00), // 15:00-16:00 (after our 9:00-12:00 data)
            datetime!(2025-01-04 16:00:00.0 +00:00:00),
        ).await?;
        assert_eq!(after_range_result, 0.0, "Time range after all activity states should return 0 minutes");

        // Scenario 4: Query for time range with no activity states (gap between states)
        // Our current test data has 4 contiguous 15-minute states from 9:00-12:00
        // Let's query a gap that could exist between activities
        let gap_range_result = repo.calculate_tagged_duration_in_range(
            "creating",
            datetime!(2025-01-04 12:30:00.0 +00:00:00), // 12:30-13:30 (gap after our data)
            datetime!(2025-01-04 13:30:00.0 +00:00:00),
        ).await?;
        assert_eq!(gap_range_result, 0.0, "Time range in gap between activity states should return 0 minutes");

        Ok(())
    }

    // ===== TAG_TYPE ISOLATION TESTS =====
    // Test suite for verifying that time splitting only considers tags within the same tag_type

    #[tokio::test]
    async fn test_calculate_tagged_duration_single_category_tag() -> Result<()> {
        let repo = setup_test_repo().await?;

        // Test 1-hour period with one activity state that has exactly 1 category tag
        // Should return full 60 minutes for that category tag, 0 for default tags

        let pool = &repo.pool;
        let test_start = datetime!(2025-01-03 10:00:00 UTC);
        let test_end = datetime!(2025-01-03 11:00:00 UTC); // 1 hour duration

        // Insert activity state with exactly one category tag
        sqlx::query(
            "INSERT INTO activity_state (id, state, activity_type, start_time, end_time, created_at)
             VALUES (888001, 'ACTIVE', 1, ?1, ?2, ?3)"
        )
        .bind(test_start)
        .bind(test_end)
        .bind(test_start)
        .execute(pool)
        .await?;

        // Link to exactly one category tag: "coding"
        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, app_tag_id, created_at, updated_at)
             VALUES (888001, 'coding-tag-id', NULL, datetime('now'), datetime('now'))"
        )
        .execute(pool)
        .await?;

        // Query range that encompasses our test activity
        let query_start = datetime!(2025-01-03 09:00:00 UTC);
        let query_end = datetime!(2025-01-03 12:00:00 UTC);

        // Query for "coding" (category type) - should get full 60 minutes
        let coding_minutes = repo.calculate_tagged_duration_in_range("coding", query_start, query_end).await?;

        // Query for default type tags - should get 0 minutes since this activity only has category tags
        let creating_minutes = repo.calculate_tagged_duration_in_range("creating", query_start, query_end).await?;
        let neutral_minutes = repo.calculate_tagged_duration_in_range("neutral", query_start, query_end).await?;

        // Query for other category tags - should get 0 minutes
        let browsing_minutes = repo.calculate_tagged_duration_in_range("browsing", query_start, query_end).await?;

        // Assertions
        assert_eq!(coding_minutes, 60.0, "Activity with 1 'coding' category tag should contribute full 60 minutes to 'coding'");
        assert_eq!(creating_minutes, 0.0, "Activity with only category tags should contribute 0 minutes to default 'creating' tag");
        assert_eq!(neutral_minutes, 0.0, "Activity with only category tags should contribute 0 minutes to default 'neutral' tag");
        assert_eq!(browsing_minutes, 0.0, "Activity with only 'coding' tag should contribute 0 minutes to 'browsing'");

        Ok(())
    }

    #[tokio::test]
    async fn test_calculate_tagged_duration_multiple_category_tags() -> Result<()> {
        let repo = setup_test_repo().await?;

        // Test 1-hour period with one activity state that has multiple category tags
        // Time should be split proportionally among the category tags

        let pool = &repo.pool;
        let test_start = datetime!(2025-01-03 14:00:00 UTC);
        let test_end = datetime!(2025-01-03 15:00:00 UTC); // 1 hour duration

        // Insert activity state with multiple category tags
        sqlx::query(
            "INSERT INTO activity_state (id, state, activity_type, start_time, end_time, created_at)
             VALUES (888002, 'ACTIVE', 1, ?1, ?2, ?3)"
        )
        .bind(test_start)
        .bind(test_end)
        .bind(test_start)
        .execute(pool)
        .await?;

        // Link to multiple category tags: "coding" and "browsing"
        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, app_tag_id, created_at, updated_at)
             VALUES (888002, 'coding-tag-id', NULL, datetime('now'), datetime('now')),
                    (888002, 'browsing-tag-id', NULL, datetime('now'), datetime('now'))"
        )
        .execute(pool)
        .await?;

        // Query range that encompasses our test activity
        let query_start = datetime!(2025-01-03 13:00:00 UTC);
        let query_end = datetime!(2025-01-03 16:00:00 UTC);

        // Query for each category tag - should get 60/2 = 30 minutes each
        let coding_minutes = repo.calculate_tagged_duration_in_range("coding", query_start, query_end).await?;
        let browsing_minutes = repo.calculate_tagged_duration_in_range("browsing", query_start, query_end).await?;

        // Query for default type tags - should get 0 minutes since this activity only has category tags
        let creating_minutes = repo.calculate_tagged_duration_in_range("creating", query_start, query_end).await?;

        // Query for other category tags - should get 0 minutes
        let writing_minutes = repo.calculate_tagged_duration_in_range("writing", query_start, query_end).await?;

        // Assertions
        assert_eq!(coding_minutes, 30.0, "Activity with 2 category tags should contribute 30 minutes to 'coding'");
        assert_eq!(browsing_minutes, 30.0, "Activity with 2 category tags should contribute 30 minutes to 'browsing'");
        assert_eq!(creating_minutes, 0.0, "Activity with only category tags should contribute 0 minutes to default 'creating' tag");
        assert_eq!(writing_minutes, 0.0, "Activity without 'writing' tag should contribute 0 minutes to 'writing'");

        Ok(())
    }

    #[tokio::test]
    async fn test_calculate_tagged_duration_mixed_default_and_category_tags() -> Result<()> {
        let repo = setup_test_repo().await?;

        // Test 1-hour period with one activity state that has both default and category tags
        // Time should be split separately within each tag_type

        let pool = &repo.pool;
        let test_start = datetime!(2025-01-03 18:00:00 UTC);
        let test_end = datetime!(2025-01-03 19:00:00 UTC); // 1 hour duration

        // Insert activity state with mixed tag types
        sqlx::query(
            "INSERT INTO activity_state (id, state, activity_type, start_time, end_time, created_at)
             VALUES (888003, 'ACTIVE', 1, ?1, ?2, ?3)"
        )
        .bind(test_start)
        .bind(test_end)
        .bind(test_start)
        .execute(pool)
        .await?;

        // Link to 2 default tags and 1 category tag
        // Default: "creating" and "neutral"
        // Category: "coding"
        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, app_tag_id, created_at, updated_at)
             VALUES (888003, 'creating-tag-id', NULL, datetime('now'), datetime('now')),
                    (888003, 'neutral-tag-id', NULL, datetime('now'), datetime('now')),
                    (888003, 'coding-tag-id', NULL, datetime('now'), datetime('now'))"
        )
        .execute(pool)
        .await?;

        // Query range that encompasses our test activity
        let query_start = datetime!(2025-01-03 17:00:00 UTC);
        let query_end = datetime!(2025-01-03 20:00:00 UTC);

        // Query for default tags - should split among 2 default tags: 60/2 = 30 minutes each
        let creating_minutes = repo.calculate_tagged_duration_in_range("creating", query_start, query_end).await?;
        let neutral_minutes = repo.calculate_tagged_duration_in_range("neutral", query_start, query_end).await?;

        // Query for category tag - should get full 60 minutes since it's the only category tag
        let coding_minutes = repo.calculate_tagged_duration_in_range("coding", query_start, query_end).await?;

        // Query for other tags - should get 0 minutes
        let consuming_minutes = repo.calculate_tagged_duration_in_range("consuming", query_start, query_end).await?;
        let browsing_minutes = repo.calculate_tagged_duration_in_range("browsing", query_start, query_end).await?;

        // Assertions
        assert_eq!(creating_minutes, 30.0, "Activity with mixed tags should contribute 30 minutes to 'creating' (split among 2 default tags)");
        assert_eq!(neutral_minutes, 30.0, "Activity with mixed tags should contribute 30 minutes to 'neutral' (split among 2 default tags)");
        assert_eq!(coding_minutes, 60.0, "Activity with mixed tags should contribute full 60 minutes to 'coding' (only category tag)");
        assert_eq!(consuming_minutes, 0.0, "Activity without 'consuming' tag should contribute 0 minutes");
        assert_eq!(browsing_minutes, 0.0, "Activity without 'browsing' tag should contribute 0 minutes");

        Ok(())
    }

    #[tokio::test]
    async fn test_calculate_tagged_duration_multiple_default_and_multiple_category_tags() -> Result<()> {
        let repo = setup_test_repo().await?;

        // Test 1-hour period with one activity state that has multiple tags of both types
        // Time should be split separately within each tag_type

        let pool = &repo.pool;
        let test_start = datetime!(2025-01-03 22:00:00 UTC);
        let test_end = datetime!(2025-01-03 23:00:00 UTC); // 1 hour duration

        // Insert activity state with multiple tags of both types
        sqlx::query(
            "INSERT INTO activity_state (id, state, activity_type, start_time, end_time, created_at)
             VALUES (888004, 'ACTIVE', 1, ?1, ?2, ?3)"
        )
        .bind(test_start)
        .bind(test_end)
        .bind(test_start)
        .execute(pool)
        .await?;

        // Link to 3 default tags and 2 category tags
        // Default: "creating", "consuming", "neutral"
        // Category: "coding", "writing"
        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, app_tag_id, created_at, updated_at)
             VALUES (888004, 'creating-tag-id', NULL, datetime('now'), datetime('now')),
                    (888004, 'consuming-tag-id', NULL, datetime('now'), datetime('now')),
                    (888004, 'neutral-tag-id', NULL, datetime('now'), datetime('now')),
                    (888004, 'coding-tag-id', NULL, datetime('now'), datetime('now')),
                    (888004, 'writing-tag-id', NULL, datetime('now'), datetime('now'))"
        )
        .execute(pool)
        .await?;

        // Query range that encompasses our test activity
        let query_start = datetime!(2025-01-03 21:00:00 UTC);
        let query_end = datetime!(2025-01-04 00:00:00 UTC);

        // Query for default tags - should split among 3 default tags: 60/3 = 20 minutes each
        let creating_minutes = repo.calculate_tagged_duration_in_range("creating", query_start, query_end).await?;
        let consuming_minutes = repo.calculate_tagged_duration_in_range("consuming", query_start, query_end).await?;
        let neutral_minutes = repo.calculate_tagged_duration_in_range("neutral", query_start, query_end).await?;

        // Query for category tags - should split among 2 category tags: 60/2 = 30 minutes each
        let coding_minutes = repo.calculate_tagged_duration_in_range("coding", query_start, query_end).await?;
        let writing_minutes = repo.calculate_tagged_duration_in_range("writing", query_start, query_end).await?;

        // Query for other tags - should get 0 minutes
        let idle_minutes = repo.calculate_tagged_duration_in_range("idle", query_start, query_end).await?;
        let browsing_minutes = repo.calculate_tagged_duration_in_range("browsing", query_start, query_end).await?;

        // Assertions for default tags (split among 3)
        assert_eq!(creating_minutes, 20.0, "Activity should contribute 20 minutes to 'creating' (split among 3 default tags)");
        assert_eq!(consuming_minutes, 20.0, "Activity should contribute 20 minutes to 'consuming' (split among 3 default tags)");
        assert_eq!(neutral_minutes, 20.0, "Activity should contribute 20 minutes to 'neutral' (split among 3 default tags)");

        // Assertions for category tags (split among 2)
        assert_eq!(coding_minutes, 30.0, "Activity should contribute 30 minutes to 'coding' (split among 2 category tags)");
        assert_eq!(writing_minutes, 30.0, "Activity should contribute 30 minutes to 'writing' (split among 2 category tags)");

        // Assertions for tags not present
        assert_eq!(idle_minutes, 0.0, "Activity without 'idle' tag should contribute 0 minutes");
        assert_eq!(browsing_minutes, 0.0, "Activity without 'browsing' tag should contribute 0 minutes");

        Ok(())
    }

    #[tokio::test]
    async fn test_calculate_tagged_duration_multiple_app_tags_same_name() -> Result<()> {
        let repo = setup_test_repo().await?;

        // Test the app_tag_id scenario: 1 activity state with 5 activity_state_tag records
        // 3 records with "creating" tag from different apps
        // 2 records with "neutral" tag from different apps
        // Should return: creating gets 3/5ths (36 minutes), neutral gets 2/5ths (24 minutes)

        let pool = &repo.pool;
        let test_start = datetime!(2025-01-04 8:00:00 UTC);
        let test_end = datetime!(2025-01-04 9:00:00 UTC); // 1 hour duration

        // Insert activity state
        sqlx::query(
            "INSERT INTO activity_state (id, state, activity_type, start_time, end_time, created_at)
             VALUES (777001, 'ACTIVE', 1, ?1, ?2, ?3)"
        )
        .bind(test_start)
        .bind(test_end)
        .bind(test_start)
        .execute(pool)
        .await?;

        // Link to 5 activity_state_tag records:
        // 3 with "creating" tag from different apps (Ebb, Warp, Cursor)
        // 2 with "neutral" tag from different apps (Slack, BeekeeperStudio)
        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, app_tag_id, created_at, updated_at)
             VALUES (777001, 'creating-tag-id', 'ebb-app', datetime('now'), datetime('now')),
                    (777001, 'creating-tag-id', 'warp-app', datetime('now'), datetime('now')),
                    (777001, 'creating-tag-id', 'cursor-app', datetime('now'), datetime('now')),
                    (777001, 'neutral-tag-id', 'slack-app', datetime('now'), datetime('now')),
                    (777001, 'neutral-tag-id', 'beekeeper-app', datetime('now'), datetime('now'))"
        )
        .execute(pool)
        .await?;

        // Query range that encompasses our test activity
        let query_start = datetime!(2025-01-04 7:00:00 UTC);
        let query_end = datetime!(2025-01-04 10:00:00 UTC);

        // Query for tags - should split proportionally among the number of records of the same tag_type
        let creating_minutes = repo.calculate_tagged_duration_in_range("creating", query_start, query_end).await?;
        let neutral_minutes = repo.calculate_tagged_duration_in_range("neutral", query_start, query_end).await?;

        // Query for tags not present - should get 0 minutes
        let consuming_minutes = repo.calculate_tagged_duration_in_range("consuming", query_start, query_end).await?;
        let idle_minutes = repo.calculate_tagged_duration_in_range("idle", query_start, query_end).await?;

        // Assertions
        // Total default tag records: 3 creating + 2 neutral = 5 records
        // Each record gets: 60 minutes ÷ 5 records = 12 minutes per record
        // Creating total: 3 records × 12 minutes = 36 minutes
        // Neutral total: 2 records × 12 minutes = 24 minutes
        assert_eq!(creating_minutes, 36.0, "Creating should get 3/5ths of total time: 3 × 12 = 36 minutes");
        assert_eq!(neutral_minutes, 24.0, "Neutral should get 2/5ths of total time: 2 × 12 = 24 minutes");
        assert_eq!(consuming_minutes, 0.0, "Activity without 'consuming' tag should contribute 0 minutes");
        assert_eq!(idle_minutes, 0.0, "Activity without 'idle' tag should contribute 0 minutes");

        // Verify total adds up correctly
        let total = creating_minutes + neutral_minutes;
        assert_eq!(total, 60.0, "Sum of all tag times should equal original duration");

        Ok(())
    }


    // ===== OTHER REPOSITORY TESTS =====

    #[tokio::test]
    async fn test_activity_state_repo_creation() -> Result<()> {
        let _repo = setup_test_repo().await?;
        Ok(())
    }

    #[tokio::test]
    async fn test_get_activity_state() -> Result<()> {
        let repo = setup_test_repo().await?;

        // Insert activity state with multiple tags
        let test_start = datetime!(2025-01-04 10:00:00 UTC);
        let test_end = datetime!(2025-01-04 11:00:00 UTC);
        let pool = &repo.pool;
        sqlx::query(
            "INSERT INTO activity_state (id, state, activity_type, start_time, end_time, created_at)
                VALUES (999003, 'ACTIVE', 1, ?1, ?2, ?3)"
        )
        .bind(test_start)
        .bind(test_end)
        .bind(test_start)
        .execute(pool)
        .await?;
    
        // Test retrieval of existing activity state from seeded data
        let result = repo.get_activity_state(999003).await?;
        assert!(result.is_some());

        let activity_state = result.unwrap();
        assert_eq!(activity_state.id, 999003);
        assert_eq!(activity_state.state, "ACTIVE");

        Ok(())
    }

    #[tokio::test]
    async fn test_get_activity_state_not_found() -> Result<()> {
        let repo = setup_test_repo().await?;

        let result = repo.get_activity_state(999003).await?;
        assert!(result.is_none());

        Ok(())
    }
}