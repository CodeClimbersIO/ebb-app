use ebb_db::{
    db_manager::{self, DbManager},
    db::{
        tide_repo::TideRepo,
        tide_template_repo::TideTemplateRepo,
        models::{tide::Tide, tide_template::TideTemplate},
    },
};
use std::sync::Arc;
use time::OffsetDateTime;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum TideServiceError {
    #[error("Database error: {0}")]
    Database(#[from] Box<dyn std::error::Error + Send + Sync>),
    #[error("Template not found: {template_id}")]
    TemplateNotFound { template_id: String },
    #[error("Tide not found: {tide_id}")]
    TideNotFound { tide_id: String },
    #[error("Invalid operation: {message}")]
    InvalidOperation { message: String },
}

pub type Result<T> = std::result::Result<T, TideServiceError>;

/// TideService handles CRUD operations and basic queries for tides and templates
/// This is the data access layer for tide-related operations
pub struct TideService {
    tide_repo: TideRepo,
    tide_template_repo: TideTemplateRepo,
    _db_manager: Arc<DbManager>, // Keep reference to ensure connection pool stays alive
}

impl TideService {
    pub async fn new() -> Result<Self> {
        let db_manager = db_manager::DbManager::get_shared_ebb().await
            .map_err(|e| TideServiceError::Database(Box::new(e)))?;
        
        Ok(Self {
            tide_repo: TideRepo::new(db_manager.pool.clone()),
            tide_template_repo: TideTemplateRepo::new(db_manager.pool.clone()),
            _db_manager: db_manager,
        })
    }

    pub fn new_with_manager(db_manager: Arc<DbManager>) -> Self {
        Self {
            tide_repo: TideRepo::new(db_manager.pool.clone()),
            tide_template_repo: TideTemplateRepo::new(db_manager.pool.clone()),
            _db_manager: db_manager,
        }
    }

    pub async fn create_tide_from_template(
        &self,
        template_id: &str,
        start_time: Option<OffsetDateTime>,
    ) -> Result<Tide> {
        let template = self
            .tide_template_repo
            .get_tide_template(template_id)
            .await?
            .ok_or_else(|| TideServiceError::TemplateNotFound {
                template_id: template_id.to_string(),
            })?;

        let start = start_time.unwrap_or_else(OffsetDateTime::now_utc);
        let tide = Tide::from_template(&template, start);

        self.tide_repo.create_tide(&tide).await?;

        Ok(tide)
    }

    pub async fn get_tide(&self, tide_id: &str) -> Result<Option<Tide>> {
        let tide = self.tide_repo.get_tide(tide_id).await?;
        Ok(tide)
    }

    pub async fn get_all_templates(&self) -> Result<Vec<TideTemplate>> {
        let templates = self.tide_template_repo.get_all_tide_templates().await?;
        Ok(templates)
    }

    pub async fn create_template(&self, template: &TideTemplate) -> Result<()> {
        self.tide_template_repo.create_tide_template(template).await?;
        Ok(())
    }

    /// Get a specific template by ID
    pub async fn get_template(&self, template_id: &str) -> Result<Option<TideTemplate>> {
        let template = self.tide_template_repo.get_tide_template(template_id).await?;
        Ok(template)
    }

    pub async fn update_template(&self, template: &TideTemplate) -> Result<()> {
        self.tide_template_repo.update_tide_template(template).await?;
        Ok(())
    }

    pub async fn delete_template(&self, template_id: &str) -> Result<()> {
        self.tide_template_repo.delete_tide_template(template_id).await?;
        Ok(())
    }

    pub async fn update_tide_progress(&self, tide_id: &str, actual_amount: f64) -> Result<()> {
        self.tide_repo.update_actual_amount(tide_id, actual_amount).await?;
        Ok(())
    }

    pub async fn complete_tide(&self, tide_id: &str) -> Result<()> {
        self.tide_repo.complete_tide(tide_id).await?;
        Ok(())
    }

    pub async fn get_tides_by_template(&self, template_id: &str) -> Result<Vec<Tide>> {
        let tides = self.tide_repo.get_tides_by_template(template_id).await?;
        Ok(tides)
    }

    pub async fn get_tides_in_date_range(
        &self,
        start: OffsetDateTime,
        end: OffsetDateTime,
    ) -> Result<Vec<Tide>> {
        let tides = self.tide_repo.get_tides_in_date_range(start, end).await?;
        Ok(tides)
    }

    pub async fn get_all_tides(&self) -> Result<Vec<Tide>> {
        let tides = self.tide_repo.get_all_tides().await?;
        Ok(tides)
    }

    /// Get or create active tides for the current period based on templates
    /// This method ensures that all templates have appropriate active tides for the evaluation time
    /// Currently only creates tides for the current evaluation time (no backfill)
    pub async fn get_or_create_active_tides_for_period(&self, evaluation_time: OffsetDateTime) -> Result<Vec<Tide>> {
        // Get all templates and active tides (2 efficient queries)
        let templates = self.get_all_templates().await?;
        let mut active_tides = self.tide_repo.get_active_tides_at(evaluation_time).await?;
        
        // Create a set of template IDs that already have active tides
        let active_template_ids: std::collections::HashSet<String> = active_tides
            .iter()
            .map(|tide| tide.tide_template_id.clone())
            .collect();
        
        // Find templates that don't have active tides
        let templates_needing_evaluation: Vec<&TideTemplate> = templates
            .iter()
            .filter(|template| !active_template_ids.contains(&template.id))
            .collect();
        
        // For each template without an active tide, check if we should create one
        for template in templates_needing_evaluation {
            if self.should_create_tide_now(template, evaluation_time) {
                // Calculate the appropriate start time based on tide frequency
                let tide_start_time = self.calculate_tide_start_time(template, evaluation_time);
                let new_tide = self.create_tide_from_template(&template.id, Some(tide_start_time)).await?;
                active_tides.push(new_tide);
            }
        }
        
        Ok(active_tides)
    }

    /// Determine if we should create a new tide for a template at the given time
    fn should_create_tide_now(&self, template: &TideTemplate, evaluation_time: OffsetDateTime) -> bool {
        match template.tide_frequency.as_str() {
            "indefinite" => true, // Always create if no active tide exists
            "daily" => {
                // Only create if evaluation day matches the template's day_of_week pattern
                let current_weekday = evaluation_time.weekday().number_days_from_sunday() as u8;
                let allowed_days = template.get_days_of_week();
                allowed_days.contains(&current_weekday)
            },
            "weekly" => true, // Always create if no active tide exists
            "monthly" => true, // Always create if no active tide exists
            _ => false, // Unknown frequency
        }
    }

    /// Calculate the appropriate start time for a new tide based on the template frequency
    fn calculate_tide_start_time(&self, template: &TideTemplate, evaluation_time: OffsetDateTime) -> OffsetDateTime {
        use crate::time_helpers::{get_day_start, get_week_start, get_month_start};

        match template.tide_frequency.as_str() {
            "daily" => get_day_start(evaluation_time),  // Start of the current day
            "weekly" => get_week_start(evaluation_time), // Start of the current week
            "monthly" => get_month_start(evaluation_time), // Start of the current month
            "indefinite" => get_day_start(evaluation_time), // Default to start of day for indefinite
            _ => evaluation_time, // Fallback to current time for unknown frequencies
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;
    use time::macros::datetime;

    // NOTE: The database migrations create 2 default templates that affect test expectations:
    // 1. 'default-daily-template' - daily, weekdays only (Mon-Fri), creating, 180.0 goal
    // 2. 'default-weekly-template' - weekly, all days, learning, 600.0 goal
    // Tests running on Monday (evaluation_time) will create tides for both default templates,
    // so expected counts should account for these 2 additional tides.

    async fn create_test_db_manager() -> Arc<DbManager> {
        use ebb_db::migrations::get_migrations;

        // Create in-memory database
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

        // Run migrations manually
        let migrations = get_migrations();
        for migration in migrations {
            sqlx::query(&migration.sql)
                .execute(&pool)
                .await
                .unwrap();
        }

        Arc::new(DbManager { pool })
    }

    #[tokio::test]
    async fn test_tide_service_creation() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let _tide_service = TideService::new_with_manager(db_manager);
        
        Ok(())
    }

    #[tokio::test]
    async fn test_create_tide_from_template() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_service = TideService::new_with_manager(db_manager);

        // First create a template
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template = TideTemplate::new(
            "creating".to_string(),
            "daily".to_string(),
            100.0,
            first_tide,
            None,
        );
        tide_service.create_template(&template).await?;

        // Now create a tide from the template
        let tide = tide_service
            .create_tide_from_template(&template.id, None)
            .await?;

        // Verify the tide was created correctly
        assert_eq!(tide.tide_template_id, template.id);
        assert_eq!(tide.metrics_type, "creating");
        assert_eq!(tide.tide_frequency, "daily");
        assert_eq!(tide.goal_amount, 100.0);
        assert_eq!(tide.actual_amount, 0.0);
        assert!(tide.end.is_some()); // Should have system-generated end time
        assert!(tide.completed_at.is_none()); // Should not be completed yet

        Ok(())
    }

    #[tokio::test]
    async fn test_complete_tide() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_service = TideService::new_with_manager(db_manager);

        // Create a template and tide
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template = TideTemplate::new(
            "creating".to_string(),
            "daily".to_string(),
            100.0,
            first_tide,
            None,
        );
        tide_service.create_template(&template).await?;

        let tide = tide_service
            .create_tide_from_template(&template.id, None)
            .await?;

        // Complete the tide
        tide_service.complete_tide(&tide.id).await?;

        // Verify it's completed
        let completed_tide = tide_service.get_tide(&tide.id).await?;
        assert!(completed_tide.is_some());
        let completed_tide = completed_tide.unwrap();
        assert!(completed_tide.completed_at.is_some());

        Ok(())
    }

    #[tokio::test]
    async fn test_should_create_tide_now_indefinite_always_true() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_service = TideService::new_with_manager(db_manager);

        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let indefinite_template = TideTemplate::new(
            "project".to_string(),
            "indefinite".to_string(),
            1000.0,
            first_tide,
            None,
        );

        let test_time = datetime!(2025-01-06 10:00 UTC); // Monday
        assert!(tide_service.should_create_tide_now(&indefinite_template, test_time));

        Ok(())
    }

    #[tokio::test]
    async fn test_should_create_tide_now_weekly_always_true() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_service = TideService::new_with_manager(db_manager);

        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let weekly_template = TideTemplate::new(
            "learning".to_string(),
            "weekly".to_string(),
            500.0,
            first_tide,
            None,
        );

        let test_time = datetime!(2025-01-06 10:00 UTC); // Monday
        assert!(tide_service.should_create_tide_now(&weekly_template, test_time));

        Ok(())
    }

    #[tokio::test]
    async fn test_should_create_tide_now_monthly_always_true() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_service = TideService::new_with_manager(db_manager);

        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let monthly_template = TideTemplate::new(
            "fitness".to_string(),
            "monthly".to_string(),
            2000.0,
            first_tide,
            None,
        );

        let test_time = datetime!(2025-01-06 10:00 UTC); // Monday
        assert!(tide_service.should_create_tide_now(&monthly_template, test_time));

        Ok(())
    }

    #[tokio::test]
    async fn test_should_create_tide_now_daily_weekdays_only() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_service = TideService::new_with_manager(db_manager);

        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let weekday_template = TideTemplate::new(
            "creating".to_string(),
            "daily".to_string(),
            100.0,
            first_tide,
            Some("1,2,3,4,5".to_string()), // Monday through Friday
        );

        // Test Monday (1) - should be true
        let monday = datetime!(2025-01-06 10:00 UTC); // This is a Monday
        assert!(tide_service.should_create_tide_now(&weekday_template, monday));

        // Test Tuesday (2) - should be true
        let tuesday = datetime!(2025-01-07 10:00 UTC); // This is a Tuesday
        assert!(tide_service.should_create_tide_now(&weekday_template, tuesday));

        // Test Friday (5) - should be true
        let friday = datetime!(2025-01-03 10:00 UTC); // This is a Friday
        assert!(tide_service.should_create_tide_now(&weekday_template, friday));

        // Test Sunday (0) - should be false
        let sunday = datetime!(2025-01-05 10:00 UTC); // This is a Sunday
        assert!(!tide_service.should_create_tide_now(&weekday_template, sunday));

        // Test Saturday (6) - should be false
        let saturday = datetime!(2025-01-04 10:00 UTC); // This is a Saturday
        assert!(!tide_service.should_create_tide_now(&weekday_template, saturday));

        Ok(())
    }

    #[tokio::test]
    async fn test_should_create_tide_now_daily_all_days() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_service = TideService::new_with_manager(db_manager);

        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let all_days_template = TideTemplate::new(
            "creating".to_string(),
            "daily".to_string(),
            100.0,
            first_tide,
            None, // All days (default)
        );

        // Test various days - all should be true
        let monday = datetime!(2025-01-06 10:00 UTC); // Monday
        assert!(tide_service.should_create_tide_now(&all_days_template, monday));

        let sunday = datetime!(2025-01-05 10:00 UTC); // Sunday
        assert!(tide_service.should_create_tide_now(&all_days_template, sunday));

        let saturday = datetime!(2025-01-04 10:00 UTC); // Saturday
        assert!(tide_service.should_create_tide_now(&all_days_template, saturday));

        Ok(())
    }

    #[tokio::test]
    async fn test_should_create_tide_now_daily_specific_days() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_service = TideService::new_with_manager(db_manager);

        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let specific_days_template = TideTemplate::new(
            "creating".to_string(),
            "daily".to_string(),
            100.0,
            first_tide,
            Some("1,3,5".to_string()), // Monday, Wednesday, Friday
        );

        // Test Monday (1) - should be true
        let monday = datetime!(2025-01-06 10:00 UTC);
        assert!(tide_service.should_create_tide_now(&specific_days_template, monday));

        // Test Wednesday (3) - should be true
        let wednesday = datetime!(2025-01-08 10:00 UTC);
        assert!(tide_service.should_create_tide_now(&specific_days_template, wednesday));

        // Test Friday (5) - should be true
        let friday = datetime!(2025-01-03 10:00 UTC);
        assert!(tide_service.should_create_tide_now(&specific_days_template, friday));

        // Test Tuesday (2) - should be false
        let tuesday = datetime!(2025-01-07 10:00 UTC);
        assert!(!tide_service.should_create_tide_now(&specific_days_template, tuesday));

        // Test Sunday (0) - should be false
        let sunday = datetime!(2025-01-05 10:00 UTC);
        assert!(!tide_service.should_create_tide_now(&specific_days_template, sunday));

        Ok(())
    }

    #[tokio::test]
    async fn test_should_create_tide_now_unknown_frequency() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_service = TideService::new_with_manager(db_manager);

        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let unknown_template = TideTemplate::new(
            "unknown".to_string(),
            "yearly".to_string(), // Unknown frequency
            1000.0,
            first_tide,
            None,
        );

        let test_time = datetime!(2025-01-06 10:00 UTC);
        assert!(!tide_service.should_create_tide_now(&unknown_template, test_time));

        Ok(())
    }

    #[tokio::test]
    async fn test_get_or_create_active_tides_for_period_no_templates() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_service = TideService::new_with_manager(db_manager);

        let evaluation_time = datetime!(2025-01-06 10:00 UTC); // Monday
        
        // Should have 2 default templates: daily (weekdays) and weekly (all days)
        // Both should create tides on Monday
        let active_tides = tide_service.get_or_create_active_tides_for_period(evaluation_time).await?;
        assert_eq!(active_tides.len(), 2);

        Ok(())
    }

    #[tokio::test]
    async fn test_get_or_create_active_tides_for_period_indefinite_template() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_service = TideService::new_with_manager(db_manager);

        // Create an indefinite template
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template = TideTemplate::new(
            "project".to_string(),
            "indefinite".to_string(),
            1000.0,
            first_tide,
            None,
        );
        tide_service.create_template(&template).await?;

        let evaluation_time = datetime!(2025-01-06 10:00 UTC); // Monday

        // Should create a tide since indefinite templates always get one
        // Plus 2 default templates (daily weekdays + weekly all days) = 3 total
        let active_tides = tide_service.get_or_create_active_tides_for_period(evaluation_time).await?;
        assert_eq!(active_tides.len(), 3);
        assert_eq!(active_tides[0].tide_template_id, template.id);
        assert_eq!(active_tides[0].tide_frequency, "indefinite");

        // Call again - should not create another tide (should return existing active tide)
        let active_tides_2 = tide_service.get_or_create_active_tides_for_period(evaluation_time).await?;
        assert_eq!(active_tides_2.len(), 3);
        assert_eq!(active_tides_2[0].id, active_tides[0].id);

        Ok(())
    }

    #[tokio::test]
    async fn test_get_or_create_active_tides_for_period_daily_weekdays_monday() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_service = TideService::new_with_manager(db_manager);

        // Create a daily template for weekdays only (Monday-Friday: 1,2,3,4,5)
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template = TideTemplate::new(
            "creating".to_string(),
            "daily".to_string(),
            100.0,
            first_tide,
            Some("1,2,3,4,5".to_string()), // Monday through Friday
        );
        tide_service.create_template(&template).await?;

        // Test on Monday (day 1) - should create tide
        // Plus 2 default templates = 3 total
        let monday_time = datetime!(2025-01-06 10:00 UTC); // Monday
        let active_tides = tide_service.get_or_create_active_tides_for_period(monday_time).await?;
        assert_eq!(active_tides.len(), 3);
        assert_eq!(active_tides[0].tide_template_id, template.id);

        Ok(())
    }

    #[tokio::test]
    async fn test_get_or_create_active_tides_for_period_daily_weekdays_sunday() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_service = TideService::new_with_manager(db_manager);

        // Create a daily template for weekdays only (Monday-Friday: 1,2,3,4,5)
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template = TideTemplate::new(
            "creating".to_string(),
            "daily".to_string(),
            100.0,
            first_tide,
            Some("1,2,3,4,5".to_string()), // Monday through Friday
        );
        tide_service.create_template(&template).await?;

        // Test on Sunday (day 0) - should NOT create tide for weekdays-only template
        // But default weekly template should create = 1 total tide
        let sunday_time = datetime!(2025-01-05 10:00 UTC); // Sunday
        let active_tides = tide_service.get_or_create_active_tides_for_period(sunday_time).await?;
        assert_eq!(active_tides.len(), 1); // Only weekly template creates on Sunday

        Ok(())
    }

    #[tokio::test]
    async fn test_get_or_create_active_tides_for_period_weekly_template() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_service = TideService::new_with_manager(db_manager);

        // Create a weekly template
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template = TideTemplate::new(
            "learning".to_string(),
            "weekly".to_string(),
            500.0,
            first_tide,
            None,
        );
        tide_service.create_template(&template).await?;

        let evaluation_time = datetime!(2025-01-06 10:00 UTC); // Monday

        // Should create a tide since weekly templates always get one if none exists
        // Plus 2 default templates = 3 total
        let active_tides = tide_service.get_or_create_active_tides_for_period(evaluation_time).await?;
        assert_eq!(active_tides.len(), 3);
        assert_eq!(active_tides[0].tide_template_id, template.id);
        assert_eq!(active_tides[0].tide_frequency, "weekly");

        Ok(())
    }

    #[tokio::test]
    async fn test_get_or_create_active_tides_for_period_multiple_templates() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_service = TideService::new_with_manager(db_manager);

        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let evaluation_time = datetime!(2025-01-06 10:00 UTC); // Monday

        // Create multiple templates
        let indefinite_template = TideTemplate::new(
            "project".to_string(),
            "indefinite".to_string(),
            1000.0,
            first_tide,
            None,
        );
        let weekly_template = TideTemplate::new(
            "learning".to_string(),
            "weekly".to_string(),
            500.0,
            first_tide,
            None,
        );
        let daily_template = TideTemplate::new(
            "creating".to_string(),
            "daily".to_string(),
            100.0,
            first_tide,
            None, // All days
        );

        tide_service.create_template(&indefinite_template).await?;
        tide_service.create_template(&weekly_template).await?;
        tide_service.create_template(&daily_template).await?;

        // Should create tides for all templates (3 custom + 2 default = 5 total)
        let active_tides = tide_service.get_or_create_active_tides_for_period(evaluation_time).await?;
        assert_eq!(active_tides.len(), 5);

        // Verify all template IDs are represented
        let template_ids: std::collections::HashSet<String> = active_tides
            .iter()
            .map(|tide| tide.tide_template_id.clone())
            .collect();
        
        assert!(template_ids.contains(&indefinite_template.id));
        assert!(template_ids.contains(&weekly_template.id));
        assert!(template_ids.contains(&daily_template.id));

        Ok(())
    }

    #[tokio::test]
    async fn test_get_or_create_active_tides_for_period_existing_active_tide() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_service = TideService::new_with_manager(db_manager);

        // Create template and manually create a tide
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template = TideTemplate::new(
            "creating".to_string(),
            "daily".to_string(),
            100.0,
            first_tide,
            None,
        );
        tide_service.create_template(&template).await?;

        let evaluation_time = datetime!(2025-01-06 10:00 UTC); // Monday

        // Manually create an active tide
        let existing_tide = tide_service
            .create_tide_from_template(&template.id, Some(evaluation_time))
            .await?;

        // Should return the existing tide, not create a new one (1 custom + 2 default = 3 total)
        let active_tides = tide_service.get_or_create_active_tides_for_period(evaluation_time).await?;
        assert_eq!(active_tides.len(), 3);
        assert!(active_tides.iter().any(|t| t.id == existing_tide.id));

        Ok(())
    }

    #[tokio::test]
    async fn test_get_or_create_active_tides_for_period_mixed_scenario() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_service = TideService::new_with_manager(db_manager);

        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let evaluation_time = datetime!(2025-01-06 10:00 UTC); // Monday

        // Create templates with different scenarios
        let template_with_active = TideTemplate::new(
            "existing".to_string(),
            "daily".to_string(),
            100.0,
            first_tide,
            None,
        );
        let template_should_create = TideTemplate::new(
            "should_create".to_string(),
            "weekly".to_string(),
            200.0,
            first_tide,
            None,
        );
        let template_weekdays_only = TideTemplate::new(
            "weekdays".to_string(),
            "daily".to_string(),
            300.0,
            first_tide,
            Some("1,2,3,4,5".to_string()), // Weekdays only
        );

        tide_service.create_template(&template_with_active).await?;
        tide_service.create_template(&template_should_create).await?;
        tide_service.create_template(&template_weekdays_only).await?;

        // Pre-create a tide for the first template
        let existing_tide = tide_service
            .create_tide_from_template(&template_with_active.id, Some(evaluation_time))
            .await?;

        // Run the function
        let active_tides = tide_service.get_or_create_active_tides_for_period(evaluation_time).await?;
        
        // Should have 5 tides: 1 existing + 2 newly created + 2 default templates
        assert_eq!(active_tides.len(), 5);

        // Verify existing tide is included
        assert!(active_tides.iter().any(|t| t.id == existing_tide.id));
        
        // Verify new tides were created for the other templates
        let new_template_ids: std::collections::HashSet<String> = active_tides
            .iter()
            .filter(|t| t.id != existing_tide.id)
            .map(|t| t.tide_template_id.clone())
            .collect();
        
        assert!(new_template_ids.contains(&template_should_create.id));
        assert!(new_template_ids.contains(&template_weekdays_only.id));

        Ok(())
    }

    #[tokio::test]
    async fn test_tide_starts_at_beginning_of_day() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_service = TideService::new_with_manager(db_manager.clone());

        // Create a daily template
        let template = TideTemplate::new(
            "creating".to_string(),
            "daily".to_string(),
            180.0,
            datetime!(2025-01-06 00:00 UTC),
            Some("1,2,3,4,5".to_string()),
        );
        tide_service.create_template(&template).await?;

        // Test evaluation time in the middle of the day (2:30 PM)
        let evaluation_time = datetime!(2025-01-06 14:30 UTC);

        let active_tides = tide_service.get_or_create_active_tides_for_period(evaluation_time).await?;

        // Should create tides (including from seeded templates), find our specific one
        assert!(active_tides.len() == 3);

        // Find the tide created from our template
        let our_tide = active_tides.iter()
            .find(|t| t.tide_template_id == template.id)
            .expect("Should find our tide");

        // The tide should start at the beginning of the day (midnight) in local timezone
        assert_eq!(our_tide.start.hour(), 0);
        assert_eq!(our_tide.start.minute(), 0);
        assert_eq!(our_tide.start.second(), 0);

        // Verify the date in local timezone matches expected date
        let evaluation_local = evaluation_time.to_offset(our_tide.start.offset());
        assert_eq!(our_tide.start.date(), evaluation_local.date());

        // The tide should end at the end of the day (for daily tides) in local timezone
        let end_time = our_tide.end.expect("Daily tide should have an end time");
        assert_eq!(end_time.hour(), 0);
        assert_eq!(end_time.minute(), 0);
        assert_eq!(end_time.second(), 0);

        Ok(())
    }
}