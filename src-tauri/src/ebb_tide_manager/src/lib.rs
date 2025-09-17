pub mod tide_scheduler;
pub mod tide_service;
pub mod tide_progress;
pub mod time_helpers;

use std::sync::Arc;
use thiserror::Error;
use time::OffsetDateTime;
use tide_scheduler::{TideScheduler, TideSchedulerError, TideSchedulerEvent};
use tide_service::{TideService, TideServiceError};
use tide_progress::{TideProgress, TideProgressError};

#[derive(Error, Debug)]
pub enum TideManagerError {
    #[error("Service error: {0}")]
    Service(#[from] TideServiceError),
    #[error("Scheduler error: {0}")]
    Scheduler(#[from] TideSchedulerError),
    #[error("Progress error: {0}")]
    Progress(#[from] TideProgressError),
    #[error("Manager already running")]
    AlreadyRunning,
    #[error("Manager not running")]
    NotRunning,
    #[error("Invalid operation: {message}")]
    InvalidOperation { message: String },
}

pub type Result<T> = std::result::Result<T, TideManagerError>;

/// TideManager handles lifecycle management activities for tides
/// This includes scheduling, automatic generation, and complex business workflows
pub struct TideManager {
    scheduler: Arc<TideScheduler>,
    service: Arc<TideService>,
    progress: Arc<TideProgress>,
}

impl TideManager {
    /// Create a new TideManager with default configuration (60 second intervals)
    pub async fn new() -> Result<Self> {
        Self::new_with_interval(15).await
    }

    /// Create a new TideManager with custom interval
    pub async fn new_with_interval(interval_seconds: u64) -> Result<Self> {
        println!("Creating TideManager with interval: {} seconds", interval_seconds);
        let scheduler = Arc::new(TideScheduler::new(interval_seconds)?);
        let service = Arc::new(TideService::new().await?);
        let progress = Arc::new(TideProgress::new().await?);

        Ok(Self { scheduler, service, progress })
    }

    /// Start the TideManager - begins listening to scheduler events
    pub async fn start(&self) -> Result<()> {
        println!("Starting TideManager");
        // Start the scheduler (it manages its own running state)
        self.scheduler.start().await?;

        // Subscribe to scheduler events and handle them
        let mut receiver = self.scheduler.subscribe();
        let service = Arc::clone(&self.service);
        let progress = Arc::clone(&self.progress);
        let scheduler = Arc::clone(&self.scheduler);

        tokio::spawn(async move {
            while scheduler.is_running() {
                match receiver.recv().await {
                    Ok(event) => {
                        if let Err(e) = Self::handle_scheduler_event(event, &service, &progress).await {
                            eprintln!("Error handling scheduler event: {}", e);
                        }
                    }
                    Err(tokio::sync::broadcast::error::RecvError::Closed) => {
                        // Scheduler closed, stop listening
                        break;
                    }
                    Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => {
                        // We're lagging behind, continue
                        eprintln!("TideManager is lagging behind scheduler events");
                        continue;
                    }
                }
            }
        });

        Ok(())
    }

    /// Stop the TideManager - delegates to scheduler
    pub fn stop(&self) -> Result<()> {
        self.scheduler.stop()?;
        Ok(())
    }

    /// Check if the TideManager is currently running - delegates to scheduler
    pub fn is_running(&self) -> bool {
        self.scheduler.is_running()
    }

    /// Handle scheduler events (private method)
    async fn handle_scheduler_event(
        event: TideSchedulerEvent,
        service: &TideService,
        progress: &TideProgress,
    ) -> Result<()> {
        match event {
            TideSchedulerEvent::Check { timestamp: _ } => {
                // Placeholder for tide lifecycle operations
                Self::perform_tide_check(service, progress).await?;
            }
        }
        Ok(())
    }

    /// Perform tide lifecycle checks - the core tide management logic
    async fn perform_tide_check(service: &TideService, progress: &TideProgress) -> Result<()> {
        let evaluation_time = OffsetDateTime::now_utc();

        // Get or create active tides for current period
        let active_tides = service.get_or_create_active_tides_for_period(evaluation_time).await?;
        println!("Active tides: {:?}", active_tides);

        for mut tide in active_tides {
            // Update progress
            let current_progress = progress.update_tide_progress(&mut tide, service, evaluation_time).await?;

            println!("Tide {} progress: {}/{}", tide.id, current_progress, tide.goal_amount);

            // Check if tide should be completed
            if progress.should_complete_tide(&tide, evaluation_time).await? {
                println!("Completing tide {}", tide.id);
                service.complete_tide(&tide.id).await?;
                progress.clear_tide_cache(&tide.id).await; // Clear cache for completed tide
            }
        }

        Ok(())
    }
}

#[cfg(test)]
pub mod test_helpers {
    use ebb_db::db_manager::DbManager;
    use sqlx::sqlite::SqlitePoolOptions;
    use std::sync::Arc;

    /// Create a test database with all necessary tables for TideManager tests
    pub async fn create_test_db_manager() -> Arc<DbManager> {
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

        // Run the ebb_db migrations to get tide tables
        let migrations = ebb_db::migrations::get_migrations();
        for migration in migrations {
            sqlx::query(&migration.sql).execute(&pool).await.unwrap();
        }

        // Create the CodeClimbers-specific tables for activity tracking
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

        Arc::new(DbManager { pool })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::test_helpers::create_test_db_manager;

    #[tokio::test]
    async fn test_perform_tide_check_workflow() -> Result<()> {
        let db_manager = create_test_db_manager().await;

        // Create TideService and TideProgress
        let service = TideService::new_with_manager(db_manager.clone());
        let progress = TideProgress::new_with_db_manager(db_manager.clone());

        // Create a test tide that covers "now" so it will be active
        let now_time = OffsetDateTime::now_utc();
        let tide_start = now_time - time::Duration::hours(2); // Started 2 hours ago
        let tide_end = now_time + time::Duration::hours(2);   // Ends 2 hours from now

        let tide = ebb_db::db::models::tide::Tide::new(
            tide_start,
            Some(tide_end),
            "creating".to_string(),
            "daily".to_string(),
            60.0, // Goal is 60 minutes - easy to exceed
            "default-daily-template".to_string(),
        );

        // Insert tide into database
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
        .map_err(|e| TideManagerError::Service(TideServiceError::Database(Box::new(e))))?;

        // Create activity data that exceeds the goal (90 minutes > 60 goal)
        let tag_id = "test-creating-tag";
        let now = now_time;

        // Insert tag
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
        .map_err(|e| TideManagerError::Service(TideServiceError::Database(Box::new(e))))?;

        // Insert 90 minutes of activity within the tide period (exceeds 60 minute goal)
        let activity_start = tide_start + time::Duration::minutes(30);
        let activity_end = activity_start + time::Duration::minutes(90);

        sqlx::query(
            "INSERT INTO activity_state (id, state, app_switches, start_time, end_time, created_at)
             VALUES (1, 'ACTIVE', 0, ?1, ?2, ?3)"
        )
        .bind(activity_start)
        .bind(activity_end)
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideManagerError::Service(TideServiceError::Database(Box::new(e))))?;

        sqlx::query(
            "INSERT INTO activity_state_tag (activity_state_id, tag_id, created_at, updated_at)
             VALUES ('1', ?1, ?2, ?3)"
        )
        .bind(tag_id)
        .bind(now)
        .bind(now)
        .execute(&db_manager.pool)
        .await
        .map_err(|e| TideManagerError::Service(TideServiceError::Database(Box::new(e))))?;

        // Verify tide is not completed initially
        let tide_before = service.get_tide(&tide.id).await?.unwrap();
        assert!(tide_before.completed_at.is_none(), "Tide should not be completed initially");
        assert_eq!(tide_before.actual_amount, 0.0, "Tide should start with 0 progress");

        // Run the tide check workflow
        TideManager::perform_tide_check(&service, &progress).await?;

        // Verify the workflow worked:
        // 1. Progress was updated in database
        // 2. Tide was completed because progress (90) >= goal (60)
        let tide_after = service.get_tide(&tide.id).await?.unwrap();
        assert!(tide_after.completed_at.is_some(), "Tide should be completed after workflow");
        assert!((tide_after.actual_amount - 90.0).abs() < 0.01, "Tide actual_amount should be ~90 minutes");

        Ok(())
    }
}
