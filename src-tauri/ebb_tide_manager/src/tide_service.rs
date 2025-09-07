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

    pub async fn get_active_tides(&self) -> Result<Vec<Tide>> {
        let tides = self.tide_repo.get_active_tides().await?;
        Ok(tides)
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
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;
    use time::macros::datetime;

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
}