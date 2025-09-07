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
pub enum TideManagerError {
    #[error("Database error: {0}")]
    Database(#[from] Box<dyn std::error::Error + Send + Sync>),
    #[error("Template not found: {template_id}")]
    TemplateNotFound { template_id: String },
    #[error("Tide not found: {tide_id}")]
    TideNotFound { tide_id: String },
    #[error("Invalid operation: {message}")]
    InvalidOperation { message: String },
}

pub type Result<T> = std::result::Result<T, TideManagerError>;

pub struct TideManager {
    tide_repo: TideRepo,
    tide_template_repo: TideTemplateRepo,
    _db_manager: Arc<DbManager>, // Keep reference to ensure connection pool stays alive
}

impl TideManager {
    /// Create a new TideManager using the shared connection pool
    /// This ensures we reuse the same database connections as the rest of the application
    pub async fn new() -> Result<Self> {
        let db_manager = db_manager::DbManager::get_shared_ebb().await
            .map_err(|e| TideManagerError::Database(Box::new(e)))?;
        
        Ok(Self {
            tide_repo: TideRepo::new(db_manager.pool.clone()),
            tide_template_repo: TideTemplateRepo::new(db_manager.pool.clone()),
            _db_manager: db_manager,
        })
    }

    /// Create a new TideManager with a specific database manager (useful for testing)
    pub fn new_with_manager(db_manager: Arc<DbManager>) -> Self {
        Self {
            tide_repo: TideRepo::new(db_manager.pool.clone()),
            tide_template_repo: TideTemplateRepo::new(db_manager.pool.clone()),
            _db_manager: db_manager,
        }
    }

    /// Create a new tide from an existing template
    /// This is our first core business logic method
    pub async fn create_tide_from_template(
        &self,
        template_id: &str,
        start_time: Option<OffsetDateTime>,
    ) -> Result<Tide> {
        // Validate template exists
        let template = self
            .tide_template_repo
            .get_tide_template(template_id)
            .await?
            .ok_or_else(|| TideManagerError::TemplateNotFound {
                template_id: template_id.to_string(),
            })?;

        // Create tide with current time or specified start time
        let start = start_time.unwrap_or_else(OffsetDateTime::now_utc);
        let tide = Tide::from_template(&template, start);

        // Save to database
        self.tide_repo.create_tide(&tide).await?;

        Ok(tide)
    }

    /// Get all active tides (tides without an end time)
    pub async fn get_active_tides(&self) -> Result<Vec<Tide>> {
        let tides = self.tide_repo.get_active_tides().await?;
        Ok(tides)
    }

    /// Get a specific tide by ID
    pub async fn get_tide(&self, tide_id: &str) -> Result<Option<Tide>> {
        let tide = self.tide_repo.get_tide(tide_id).await?;
        Ok(tide)
    }

    /// Get all available tide templates
    pub async fn get_all_templates(&self) -> Result<Vec<TideTemplate>> {
        let templates = self.tide_template_repo.get_all_tide_templates().await?;
        Ok(templates)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;

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
    async fn test_tide_manager_creation() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let _tide_manager = TideManager::new_with_manager(db_manager);
        
        // If we get here without panicking, connection sharing works
        Ok(())
    }

    #[tokio::test]
    async fn test_create_tide_from_template() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_manager = TideManager::new_with_manager(db_manager);

        // First create a template
        let template = TideTemplate::new("creating".to_string(), "daily".to_string(), 100.0);
        tide_manager.tide_template_repo.create_tide_template(&template).await?;

        // Now create a tide from the template
        let tide = tide_manager
            .create_tide_from_template(&template.id, None)
            .await?;

        // Verify the tide was created correctly
        assert_eq!(tide.tide_template_id, template.id);
        assert_eq!(tide.metrics_type, "creating");
        assert_eq!(tide.tide_frequency, "daily");
        assert_eq!(tide.goal_amount, 100.0);
        assert_eq!(tide.actual_amount, 0.0);
        assert!(tide.end.is_none());

        // Verify it's in the database
        let retrieved_tide = tide_manager.get_tide(&tide.id).await?;
        assert!(retrieved_tide.is_some());
        assert_eq!(retrieved_tide.unwrap().id, tide.id);

        Ok(())
    }

    #[tokio::test]
    async fn test_create_tide_from_nonexistent_template() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_manager = TideManager::new_with_manager(db_manager);

        // Try to create tide from non-existent template
        let result = tide_manager
            .create_tide_from_template("nonexistent-id", None)
            .await;

        // Should return TemplateNotFound error
        assert!(matches!(result, Err(TideManagerError::TemplateNotFound { .. })));

        Ok(())
    }

    #[tokio::test]
    async fn test_get_active_tides() -> Result<()> {
        let db_manager = create_test_db_manager().await;
        let tide_manager = TideManager::new_with_manager(db_manager);

        // Create a template
        let template = TideTemplate::new("learning".to_string(), "weekly".to_string(), 500.0);
        tide_manager.tide_template_repo.create_tide_template(&template).await?;

        // Create two tides
        let tide1 = tide_manager.create_tide_from_template(&template.id, None).await?;
        let tide2 = tide_manager.create_tide_from_template(&template.id, None).await?;

        // End one tide
        tide_manager.tide_repo.end_tide(&tide1.id, OffsetDateTime::now_utc()).await?;

        // Get active tides - should only return tide2
        let active_tides = tide_manager.get_active_tides().await?;
        assert_eq!(active_tides.len(), 1);
        assert_eq!(active_tides[0].id, tide2.id);

        Ok(())
    }

    #[tokio::test]
    async fn test_cross_crate_connection_sharing_concept() -> Result<()> {
        // This test demonstrates that our TideManager can work with 
        // the same connection pattern as the main application
        
        let db_manager = create_test_db_manager().await;
        
        // Create multiple managers using the same connection pool
        let tide_manager1 = TideManager::new_with_manager(db_manager.clone());
        let tide_manager2 = TideManager::new_with_manager(db_manager.clone());
        
        // Create a template with manager1
        let template = TideTemplate::new("focus".to_string(), "daily".to_string(), 60.0);
        tide_manager1.tide_template_repo.create_tide_template(&template).await?;
        
        // Create a tide with manager2 (different manager, same pool)
        let tide = tide_manager2.create_tide_from_template(&template.id, None).await?;
        
        // Verify both can access the same data
        let templates1 = tide_manager1.get_all_templates().await?;
        let templates2 = tide_manager2.get_all_templates().await?;
        
        assert_eq!(templates1.len(), 1);
        assert_eq!(templates2.len(), 1);
        assert_eq!(templates1[0].id, templates2[0].id);
        
        // Verify tide is accessible from both managers
        let tide1 = tide_manager1.get_tide(&tide.id).await?;
        let tide2 = tide_manager2.get_tide(&tide.id).await?;
        
        assert!(tide1.is_some());
        assert!(tide2.is_some());
        assert_eq!(tide1.unwrap().id, tide2.unwrap().id);
        
        Ok(())
    }
}