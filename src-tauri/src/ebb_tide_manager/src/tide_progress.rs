use ebb_db::{
    db_manager::{self, DbManager},
    db::{
        activity_state_repo::ActivityStateRepo,
        models::tide::Tide,
    },
};
use crate::tide_service::{TideService, TideServiceError};
use std::collections::HashMap;
use std::sync::Arc;
use time::OffsetDateTime;
use thiserror::Error;
use tokio::sync::Mutex;

#[derive(Error, Debug)]
pub enum TideProgressError {
    #[error("Database error: {0}")]
    Database(#[from] Box<dyn std::error::Error + Send + Sync>),
    #[error("Service error: {0}")]
    Service(#[from] TideServiceError),
    #[error("Invalid operation: {message}")]
    InvalidOperation { message: String },
}

pub type Result<T> = std::result::Result<T, TideProgressError>;

/// Cached progress data for a tide
#[derive(Debug, Clone)]
pub struct CachedProgress {
    pub amount: f64,
    pub last_evaluation_time: OffsetDateTime,
}

impl CachedProgress {
    pub fn new(amount: f64, evaluation_time: OffsetDateTime) -> Self {
        Self {
            amount,
            last_evaluation_time: evaluation_time,
        }
    }
}

/// TideProgress handles querying tide progress data from the CodeClimbers database
pub struct TideProgress {
    activity_state_repo: ActivityStateRepo,
    progress_cache: Arc<Mutex<HashMap<String, CachedProgress>>>,
}

impl TideProgress {
    /// Create a new TideProgress instance
    pub async fn new() -> Result<Self> {
        let codeclimbers_db = db_manager::DbManager::get_shared_codeclimbers().await
            .map_err(|e| TideProgressError::Database(Box::new(e)))?;
        
        Ok(Self {
            activity_state_repo: ActivityStateRepo::new(codeclimbers_db.pool.clone()),
            progress_cache: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    /// Create a new TideProgress instance with a specific database manager
    pub fn new_with_db_manager(codeclimbers_db: Arc<DbManager>) -> Self {
        Self {
            activity_state_repo: ActivityStateRepo::new(codeclimbers_db.pool.clone()),
            progress_cache: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Get the current progress for a tide, using cache with incremental calculation
    pub async fn get_tide_progress_cached(&self, tide: &Tide, evaluation_time: OffsetDateTime) -> Result<f64> {
        let tide_id = &tide.id;
        
        // Check cache first and clone the data if found
        let cached_data = {
            let cache = self.progress_cache.lock().await;
            cache.get(tide_id).cloned()
        };
        
        if let Some(cached) = cached_data {
            // Cache hit - calculate incremental progress
            let delta_minutes = self
                .activity_state_repo
                .calculate_tagged_duration_in_range(
                    &tide.metrics_type, 
                    cached.last_evaluation_time, 
                    evaluation_time
                )
                .await
                .map_err(|e| TideProgressError::Database(e))?;
            
            let new_total = cached.amount + delta_minutes;
            
            // Update cache with new values
            {
                let mut cache = self.progress_cache.lock().await;
                cache.insert(tide_id.clone(), CachedProgress::new(new_total, evaluation_time));
            }
            
            return Ok(new_total);
        }
        
        // Cache miss - calculate full range from tide start
        let total_minutes = self.calculate_tide_progress(tide, evaluation_time).await?;
        
        // Store in cache
        {
            let mut cache = self.progress_cache.lock().await;
            cache.insert(tide_id.clone(), CachedProgress::new(total_minutes, evaluation_time));
        }
        
        Ok(total_minutes)
    }

    /// Calculate the current progress for a tide by querying the database
    /// Progress is calculated from tide start time to the evaluation time
    pub async fn calculate_tide_progress(&self, tide: &Tide, evaluation_time: OffsetDateTime) -> Result<f64> {
        // Use the repository to calculate the tagged duration from tide start to evaluation time
        let total_minutes = self
            .activity_state_repo
            .calculate_tagged_duration_in_range(&tide.metrics_type, tide.start, evaluation_time)
            .await
            .map_err(|e| TideProgressError::Database(e))?;

        Ok(total_minutes)
    }

    /// Clear the progress cache for a specific tide
    pub async fn clear_tide_cache(&self, tide_id: &str) {
        let mut cache = self.progress_cache.lock().await;
        cache.remove(tide_id);
    }

    /// Clear the entire progress cache
    pub async fn clear_all_cache(&self) {
        let mut cache = self.progress_cache.lock().await;
        cache.clear();
    }

    /// Check if a tide should be marked as complete
    pub async fn should_complete_tide(&self, tide: &Tide, evaluation_time: OffsetDateTime) -> Result<bool> {
        let current_progress = self.get_tide_progress_cached(tide, evaluation_time).await?;

        // If progress meets or exceeds goal, force refresh validation to ensure accuracy
        if current_progress >= tide.goal_amount {
            let validated_progress = self.calculate_tide_progress(tide, evaluation_time).await?;
            Ok(validated_progress >= tide.goal_amount)
        } else {
            Ok(false)
        }
    }

    /// Update a tide's progress in the database and cache
    pub async fn update_tide_progress(&self, tide: &mut Tide, tide_service: &TideService, evaluation_time: OffsetDateTime) -> Result<f64> {
        let current_progress = self.get_tide_progress_cached(tide, evaluation_time).await?;

        // Update the database through TideService
        tide_service.update_tide_progress(&tide.id, current_progress).await?;

        // Update the local tide object
        tide.actual_amount = current_progress;

        Ok(current_progress)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ebb_db::db::models::tide_template::TideTemplate;
    use time::macros::datetime;

    use crate::test_helpers::create_test_db_manager;

    #[tokio::test]
    async fn test_cached_progress_creation() -> Result<()> {
        let evaluation_time = datetime!(2025-01-06 10:00 UTC);
        let cached = CachedProgress::new(120.0, evaluation_time);
        
        assert_eq!(cached.amount, 120.0);
        assert_eq!(cached.last_evaluation_time, evaluation_time);
        
        Ok(())
    }

    #[tokio::test]
    async fn test_cached_progress_clone() -> Result<()> {
        let evaluation_time = datetime!(2025-01-06 10:00 UTC);
        let cached = CachedProgress::new(60.0, evaluation_time);
        let cloned = cached.clone();
        
        assert_eq!(cloned.amount, 60.0);
        assert_eq!(cloned.last_evaluation_time, evaluation_time);
        
        Ok(())
    }

    #[tokio::test]
    async fn test_tide_progress_creation() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let _tide_progress = TideProgress::new_with_db_manager(db_manager);
        
        Ok(())
    }

    #[tokio::test]
    async fn test_calculate_tide_progress() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_progress = TideProgress::new_with_db_manager(db_manager.clone());

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
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        // Create test activity states (2 hours total)
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
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        // Second activity state (1 hour)
        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at) 
             VALUES (2, 'ACTIVE', 0, ?1, ?2, ?3)"
        )
        .bind(mid_time)
        .bind(end_time)
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        // Link activity states to tag
        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at) 
             VALUES ('1', ?1, ?2, ?3)"
        )
        .bind(tag_id)
        .bind(now)
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at) 
             VALUES ('2', ?1, ?2, ?3)"
        )
        .bind(tag_id)
        .bind(now)
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        // Create a test tide
        let tide_start = datetime!(2025-01-06 08:00 UTC);
        let tide = Tide::from_template(
            &TideTemplate::new(
                "creating".to_string(),
                "daily".to_string(),
                120.0, // 2 hours goal
                tide_start,
                None,
            ),
            tide_start,
        );

        // Evaluate progress at 12:00 UTC (4 hours after tide start, covering our 2-hour activity window)
        let evaluation_time = datetime!(2025-01-06 12:00 UTC);
        let progress = tide_progress.calculate_tide_progress(&tide, evaluation_time).await?;
        
        // Use approximate equality due to floating point precision
        assert!((progress - 120.0).abs() < 0.01, "Expected ~120 minutes, got {}", progress);

        Ok(())
    }

    #[tokio::test]
    async fn test_calculate_tide_progress_partial_evaluation() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_progress = TideProgress::new_with_db_manager(db_manager.clone());

        // Create test tag and data (same as previous test)
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
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        // Create test activity states (2 hours total: 09:00-10:00 and 10:00-11:00)
        let start_time = datetime!(2025-01-06 09:00 UTC);
        let mid_time = datetime!(2025-01-06 10:00 UTC);
        let end_time = datetime!(2025-01-06 11:00 UTC);

        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at) 
             VALUES (1, 'ACTIVE', 0, ?1, ?2, ?3)"
        )
        .bind(start_time)
        .bind(mid_time)
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at) 
             VALUES (2, 'ACTIVE', 0, ?1, ?2, ?3)"
        )
        .bind(mid_time)
        .bind(end_time)
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at) 
             VALUES ('1', ?1, ?2, ?3)"
        )
        .bind(tag_id)
        .bind(now)
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at) 
             VALUES ('2', ?1, ?2, ?3)"
        )
        .bind(tag_id)
        .bind(now)
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        let tide_start = datetime!(2025-01-06 08:00 UTC);
        let tide = Tide::from_template(
            &TideTemplate::new(
                "creating".to_string(),
                "daily".to_string(),
                120.0,
                tide_start,
                None,
            ),
            tide_start,
        );

        // Test evaluation at 09:30 - should only capture half of first activity (30 minutes)
        let partial_evaluation = datetime!(2025-01-06 09:30 UTC);
        let progress = tide_progress.calculate_tide_progress(&tide, partial_evaluation).await?;
        assert!((progress - 30.0).abs() < 0.01, "Expected ~30 minutes, got {}", progress);

        // Test evaluation at 10:30 - should capture first activity + half of second (90 minutes)
        let mid_evaluation = datetime!(2025-01-06 10:30 UTC);
        let progress = tide_progress.calculate_tide_progress(&tide, mid_evaluation).await?;
        assert!((progress - 90.0).abs() < 0.01, "Expected ~90 minutes, got {}", progress);

        Ok(())
    }

    #[tokio::test]
    async fn test_get_tide_progress_cached_miss() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_progress = TideProgress::new_with_db_manager(db_manager.clone());

        // Create test data (same setup as previous tests)
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
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        // Create 1 hour of activity: 09:00-10:00
        let start_time = datetime!(2025-01-06 09:00 UTC);
        let end_time = datetime!(2025-01-06 10:00 UTC);
        
        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at) 
             VALUES (1, 'ACTIVE', 0, ?1, ?2, ?3)"
        )
        .bind(start_time)
        .bind(end_time)
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at) 
             VALUES ('1', ?1, ?2, ?3)"
        )
        .bind(tag_id)
        .bind(now)
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        let tide_start = datetime!(2025-01-06 08:00 UTC);
        let tide = Tide::from_template(
            &TideTemplate::new(
                "creating".to_string(),
                "daily".to_string(),
                120.0,
                tide_start,
                None,
            ),
            tide_start,
        );

        let evaluation_time = datetime!(2025-01-06 12:00 UTC);
        let progress = tide_progress.get_tide_progress_cached(&tide, evaluation_time).await?;
        
        // Should be 60 minutes and now cached
        assert!((progress - 60.0).abs() < 0.01, "Expected ~60 minutes, got {}", progress);

        Ok(())
    }

    #[tokio::test]
    async fn test_get_tide_progress_cached_hit_incremental() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_progress = TideProgress::new_with_db_manager(db_manager.clone());

        // Create test data
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
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        // Create first hour of activity: 09:00-10:00
        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at) 
             VALUES (1, 'ACTIVE', 0, ?1, ?2, ?3)"
        )
        .bind(datetime!(2025-01-06 09:00 UTC))
        .bind(datetime!(2025-01-06 10:00 UTC))
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at) 
             VALUES ('1', ?1, ?2, ?3)"
        )
        .bind(tag_id)
        .bind(now)
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        let tide_start = datetime!(2025-01-06 08:00 UTC);
        let tide = Tide::from_template(
            &TideTemplate::new(
                "creating".to_string(),
                "daily".to_string(),
                120.0,
                tide_start,
                None,
            ),
            tide_start,
        );

        // First call at 10:30 - should cache 60 minutes
        let first_evaluation = datetime!(2025-01-06 10:30 UTC);
        let progress1 = tide_progress.get_tide_progress_cached(&tide, first_evaluation).await?;
        assert!((progress1 - 60.0).abs() < 0.01, "Expected ~60 minutes, got {}", progress1);

        // Add more activity for the incremental test: 11:00-12:00 (another hour)
        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at) 
             VALUES (2, 'ACTIVE', 0, ?1, ?2, ?3)"
        )
        .bind(datetime!(2025-01-06 11:00 UTC))
        .bind(datetime!(2025-01-06 12:00 UTC))
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at) 
             VALUES ('2', ?1, ?2, ?3)"
        )
        .bind(tag_id)
        .bind(now)
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        // Second call at 12:30 - should use cache and add incremental (60 minutes delta)
        let second_evaluation = datetime!(2025-01-06 12:30 UTC);
        let progress2 = tide_progress.get_tide_progress_cached(&tide, second_evaluation).await?;
        assert!((progress2 - 120.0).abs() < 0.01, "Expected ~120 minutes, got {}", progress2);

        Ok(())
    }

    #[tokio::test]
    async fn test_clear_tide_cache() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_progress = TideProgress::new_with_db_manager(db_manager.clone());

        // Create test data
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
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at) 
             VALUES (1, 'ACTIVE', 0, ?1, ?2, ?3)"
        )
        .bind(datetime!(2025-01-06 09:00 UTC))
        .bind(datetime!(2025-01-06 10:00 UTC))
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at) 
             VALUES ('1', ?1, ?2, ?3)"
        )
        .bind(tag_id)
        .bind(now)
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        let tide = Tide::from_template(
            &TideTemplate::new(
                "creating".to_string(),
                "daily".to_string(),
                120.0,
                datetime!(2025-01-06 08:00 UTC),
                None,
            ),
            datetime!(2025-01-06 08:00 UTC),
        );

        // First call to populate cache
        let evaluation_time = datetime!(2025-01-06 12:00 UTC);
        let progress1 = tide_progress.get_tide_progress_cached(&tide, evaluation_time).await?;
        assert!((progress1 - 60.0).abs() < 0.01);

        // Verify cache has the value
        {
            let cache = tide_progress.progress_cache.lock().await;
            assert!(cache.contains_key(&tide.id));
        }

        // Clear cache for this specific tide
        tide_progress.clear_tide_cache(&tide.id).await;

        // Verify cache is cleared
        {
            let cache = tide_progress.progress_cache.lock().await;
            assert!(!cache.contains_key(&tide.id));
        }

        // Next call should recalculate (cache miss)
        let progress2 = tide_progress.get_tide_progress_cached(&tide, evaluation_time).await?;
        assert!((progress2 - 60.0).abs() < 0.01);

        Ok(())
    }

    #[tokio::test]
    async fn test_clear_tide_cache_nonexistent() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_progress = TideProgress::new_with_db_manager(db_manager);

        // Clearing a non-existent cache should not error
        tide_progress.clear_tide_cache("nonexistent-tide-id").await;

        Ok(())
    }

    #[tokio::test]
    async fn test_clear_all_cache() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_progress = TideProgress::new_with_db_manager(db_manager.clone());

        // Create test data
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
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at) 
             VALUES (1, 'ACTIVE', 0, ?1, ?2, ?3)"
        )
        .bind(datetime!(2025-01-06 09:00 UTC))
        .bind(datetime!(2025-01-06 10:00 UTC))
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at) 
             VALUES ('1', ?1, ?2, ?3)"
        )
        .bind(tag_id)
        .bind(now)
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        // Create two different tides
        let tide1 = Tide::from_template(
            &TideTemplate::new(
                "creating".to_string(),
                "daily".to_string(),
                120.0,
                datetime!(2025-01-06 08:00 UTC),
                None,
            ),
            datetime!(2025-01-06 08:00 UTC),
        );

        let tide2 = Tide::from_template(
            &TideTemplate::new(
                "creating".to_string(),
                "weekly".to_string(),
                300.0,
                datetime!(2025-01-06 08:00 UTC),
                None,
            ),
            datetime!(2025-01-06 08:00 UTC),
        );

        let evaluation_time = datetime!(2025-01-06 12:00 UTC);
        
        // Populate cache for both tides
        let _progress1 = tide_progress.get_tide_progress_cached(&tide1, evaluation_time).await?;
        let _progress2 = tide_progress.get_tide_progress_cached(&tide2, evaluation_time).await?;

        // Verify both are cached
        {
            let cache = tide_progress.progress_cache.lock().await;
            assert!(cache.contains_key(&tide1.id));
            assert!(cache.contains_key(&tide2.id));
            assert_eq!(cache.len(), 2);
        }

        // Clear all cache
        tide_progress.clear_all_cache().await;

        // Verify cache is completely empty
        {
            let cache = tide_progress.progress_cache.lock().await;
            assert!(!cache.contains_key(&tide1.id));
            assert!(!cache.contains_key(&tide2.id));
            assert_eq!(cache.len(), 0);
        }

        Ok(())
    }

    #[tokio::test]
    async fn test_clear_all_cache_empty() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_progress = TideProgress::new_with_db_manager(db_manager);

        // Clearing an empty cache should not error
        tide_progress.clear_all_cache().await;
        
        // Verify it's still empty
        {
            let cache = tide_progress.progress_cache.lock().await;
            assert_eq!(cache.len(), 0);
        }

        Ok(())
    }

    #[tokio::test]
    async fn test_should_complete_tide_progress_below_goal() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_progress = TideProgress::new_with_db_manager(db_manager);

        let tide = Tide::from_template(
            &TideTemplate::new(
                "creating".to_string(),
                "daily".to_string(),
                120.0, // Goal is 120 minutes
                datetime!(2025-01-06 08:00 UTC),
                None,
            ),
            datetime!(2025-01-06 08:00 UTC),
        );

        // Mock scenario: cached progress is below goal (60 < 120)
        // We need to manually insert cached data to simulate this
        {
            let mut cache = tide_progress.progress_cache.lock().await;
            cache.insert(
                tide.id.clone(),
                CachedProgress::new(60.0, datetime!(2025-01-06 10:00 UTC))
            );
        }

        let evaluation_time = datetime!(2025-01-06 12:00 UTC);
        let should_complete = tide_progress.should_complete_tide(&tide, evaluation_time).await?;

        // Should return false because cached progress (60) < goal (120)
        assert!(!should_complete);

        Ok(())
    }

    #[tokio::test]
    async fn test_should_complete_tide_cached_meets_goal_but_validated_fails() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_progress = TideProgress::new_with_db_manager(db_manager.clone());

        // Create test tag but with insufficient actual data
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
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        // Create only 1 hour of actual activity data (insufficient for 120-minute goal)
        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at)
             VALUES (1, 'ACTIVE', 0, ?1, ?2, ?3)"
        )
        .bind(datetime!(2025-01-06 09:00 UTC))
        .bind(datetime!(2025-01-06 10:00 UTC))
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at)
             VALUES ('1', ?1, ?2, ?3)"
        )
        .bind(tag_id)
        .bind(now)
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        let tide = Tide::from_template(
            &TideTemplate::new(
                "creating".to_string(),
                "daily".to_string(),
                120.0, // Goal is 120 minutes
                datetime!(2025-01-06 08:00 UTC),
                None,
            ),
            datetime!(2025-01-06 08:00 UTC),
        );

        // Mock scenario: cached progress shows >= goal (stale/incorrect cache)
        {
            let mut cache = tide_progress.progress_cache.lock().await;
            cache.insert(
                tide.id.clone(),
                CachedProgress::new(125.0, datetime!(2025-01-06 10:00 UTC))
            );
        }

        let evaluation_time = datetime!(2025-01-06 12:00 UTC);
        let should_complete = tide_progress.should_complete_tide(&tide, evaluation_time).await?;

        // Should return false because validated progress (60) < goal (120)
        // even though cached showed 125 >= 120
        assert!(!should_complete);

        Ok(())
    }

    #[tokio::test]
    async fn test_should_complete_tide_both_cached_and_validated_meet_goal() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_progress = TideProgress::new_with_db_manager(db_manager.clone());

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
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        // Create 2.5 hours of activity data (150 minutes > 120 goal)
        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at)
             VALUES (1, 'ACTIVE', 0, ?1, ?2, ?3)"
        )
        .bind(datetime!(2025-01-06 09:00 UTC))
        .bind(datetime!(2025-01-06 11:30 UTC))
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at)
             VALUES ('1', ?1, ?2, ?3)"
        )
        .bind(tag_id)
        .bind(now)
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        let tide = Tide::from_template(
            &TideTemplate::new(
                "creating".to_string(),
                "daily".to_string(),
                120.0, // Goal is 120 minutes
                datetime!(2025-01-06 08:00 UTC),
                None,
            ),
            datetime!(2025-01-06 08:00 UTC),
        );

        // Mock scenario: cached progress shows >= goal AND actual data supports it
        {
            let mut cache = tide_progress.progress_cache.lock().await;
            cache.insert(
                tide.id.clone(),
                CachedProgress::new(140.0, datetime!(2025-01-06 11:00 UTC))
            );
        }

        let evaluation_time = datetime!(2025-01-06 12:00 UTC);
        let should_complete = tide_progress.should_complete_tide(&tide, evaluation_time).await?;

        // Should return true because both cached (140) >= goal (120) AND validated (150) >= goal (120)
        assert!(should_complete);

        Ok(())
    }

    #[tokio::test]
    async fn test_update_tide_progress_basic() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_progress = TideProgress::new_with_db_manager(db_manager.clone());

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
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        // Create 1.5 hours of activity data
        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at)
             VALUES (1, 'ACTIVE', 0, ?1, ?2, ?3)"
        )
        .bind(datetime!(2025-01-06 09:00 UTC))
        .bind(datetime!(2025-01-06 10:30 UTC))
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at)
             VALUES ('1', ?1, ?2, ?3)"
        )
        .bind(tag_id)
        .bind(now)
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        // Create TideService
        use crate::tide_service::TideService;
        let tide_service = TideService::new_with_manager(db_manager.clone());

        // Create a test tide using the seeded template
        let mut tide = Tide::new(
            datetime!(2025-01-06 08:00 UTC),
            Some(datetime!(2025-01-07 08:00 UTC)), // daily tide ends next day
            "creating".to_string(),
            "daily".to_string(),
            120.0, // Goal is 120 minutes (different from seeded template's 180)
            "default-daily-template".to_string(), // Use the seeded template ID
        );

        // Insert the tide into the database so TideService can update it
        sqlx::query(
            "INSERT INTO tide (id, start, end, completed_at, metrics_type, tide_frequency, goal_amount, actual_amount, tide_template_id, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)"
        )
        .bind(&tide.id)
        .bind(tide.start)
        .bind(tide.end)
        .bind(tide.completed_at)
        .bind(&tide.metrics_type)
        .bind(&tide.tide_frequency)
        .bind(tide.goal_amount)
        .bind(tide.actual_amount)
        .bind(&tide.tide_template_id)
        .bind(tide.created_at)
        .bind(tide.updated_at)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        // Store initial actual_amount
        let initial_actual = tide.actual_amount; // Should be 0.0

        let evaluation_time = datetime!(2025-01-06 12:00 UTC);
        let returned_progress = tide_progress.update_tide_progress(&mut tide, &tide_service, evaluation_time).await?;

        // Should return 90 minutes (1.5 hours)
        assert!((returned_progress - 90.0).abs() < 0.01, "Expected ~90 minutes, got {}", returned_progress);

        // Local tide object should be updated
        assert!((tide.actual_amount - 90.0).abs() < 0.01, "Tide actual_amount should be ~90, got {}", tide.actual_amount);
        assert_ne!(tide.actual_amount, initial_actual, "Tide actual_amount should have changed from initial value");

        Ok(())
    }

    #[tokio::test]
    async fn test_update_tide_progress_with_cache() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_progress = TideProgress::new_with_db_manager(db_manager.clone());

        // Create TideService
        use crate::tide_service::TideService;
        let tide_service = TideService::new_with_manager(db_manager.clone());

        // Create a test tide using the seeded template
        let mut tide = Tide::new(
            datetime!(2025-01-06 08:00 UTC),
            Some(datetime!(2025-01-07 08:00 UTC)),
            "creating".to_string(),
            "daily".to_string(),
            120.0,
            "default-daily-template".to_string(),
        );

        // Insert the tide into the database so TideService can update it
        sqlx::query(
            "INSERT INTO tide (id, start, end, completed_at, metrics_type, tide_frequency, goal_amount, actual_amount, tide_template_id, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)"
        )
        .bind(&tide.id)
        .bind(tide.start)
        .bind(tide.end)
        .bind(tide.completed_at)
        .bind(&tide.metrics_type)
        .bind(&tide.tide_frequency)
        .bind(tide.goal_amount)
        .bind(tide.actual_amount)
        .bind(&tide.tide_template_id)
        .bind(tide.created_at)
        .bind(tide.updated_at)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideProgressError::Database(Box::new(e)))?;

        // Pre-populate cache with progress data
        {
            let mut cache = tide_progress.progress_cache.lock().await;
            cache.insert(
                tide.id.clone(),
                CachedProgress::new(75.0, datetime!(2025-01-06 10:00 UTC))
            );
        }

        let evaluation_time = datetime!(2025-01-06 12:00 UTC);
        let returned_progress = tide_progress.update_tide_progress(&mut tide, &tide_service, evaluation_time).await?;

        // Should return the cached value (since no additional activity data exists)
        assert!((returned_progress - 75.0).abs() < 0.01, "Expected ~75 minutes from cache, got {}", returned_progress);

        // Local tide object should be updated with cached value
        assert!((tide.actual_amount - 75.0).abs() < 0.01, "Tide actual_amount should be ~75, got {}", tide.actual_amount);

        Ok(())
    }
}