use sqlx::{Pool, Sqlite};

use crate::db::models::tide_template::TideTemplate;

pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;

pub struct TideTemplateRepo {
    pool: Pool<Sqlite>,
}

impl TideTemplateRepo {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    pub async fn create_tide_template(&self, template: &TideTemplate) -> Result<()> {
        sqlx::query(
            "INSERT INTO tide_template (id, metrics_type, tide_frequency, first_tide, day_of_week, goal_amount, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
        )
        .bind(&template.id)
        .bind(&template.metrics_type)
        .bind(&template.tide_frequency)
        .bind(&template.first_tide)
        .bind(&template.day_of_week)
        .bind(template.goal_amount)
        .bind(&template.created_at)
        .bind(&template.updated_at)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_tide_template(&self, id: &str) -> Result<Option<TideTemplate>> {
        let template = sqlx::query_as::<_, TideTemplate>("SELECT * FROM tide_template WHERE id = ?1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(template)
    }

    pub async fn get_all_tide_templates(&self) -> Result<Vec<TideTemplate>> {
        let templates = sqlx::query_as::<_, TideTemplate>(
            "SELECT * FROM tide_template ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(templates)
    }

    pub async fn update_tide_template(&self, template: &TideTemplate) -> Result<()> {
        sqlx::query(
            "UPDATE tide_template 
             SET metrics_type = ?2, tide_frequency = ?3, first_tide = ?4, day_of_week = ?5, goal_amount = ?6, updated_at = ?7
             WHERE id = ?1"
        )
        .bind(&template.id)
        .bind(&template.metrics_type)
        .bind(&template.tide_frequency)
        .bind(&template.first_tide)
        .bind(&template.day_of_week)
        .bind(template.goal_amount)
        .bind(&template.updated_at)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn delete_tide_template(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM tide_template WHERE id = ?1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use crate::db_manager;
    use time::macros::datetime;

    use super::*;

    fn create_test_template() -> TideTemplate {
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        TideTemplate::new(
            "creating".to_string(),
            "daily".to_string(),
            100.0,
            first_tide,
            None,
        )
    }

    #[tokio::test]
    async fn test_create_and_get_tide_template() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let repo = TideTemplateRepo::new(pool);
        
        let template = create_test_template();
        repo.create_tide_template(&template).await?;
        
        let retrieved = repo.get_tide_template(&template.id).await?;
        assert!(retrieved.is_some());
        let retrieved = retrieved.unwrap();
        assert_eq!(retrieved.id, template.id);
        assert_eq!(retrieved.metrics_type, "creating");
        assert_eq!(retrieved.tide_frequency, "daily");
        assert_eq!(retrieved.goal_amount, 100.0);
        
        Ok(())
    }

    #[tokio::test]
    async fn test_get_all_tide_templates() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let repo = TideTemplateRepo::new(pool);
        
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template1 = TideTemplate::new("creating".to_string(), "daily".to_string(), 100.0, first_tide, None);
        let template2 = TideTemplate::new("learning".to_string(), "weekly".to_string(), 500.0, first_tide, None);
        
        repo.create_tide_template(&template1).await?;
        repo.create_tide_template(&template2).await?;
        
        let all_templates = repo.get_all_tide_templates().await?;
        assert_eq!(all_templates.len(), 2);
        
        Ok(())
    }

    #[tokio::test]
    async fn test_update_tide_template() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let repo = TideTemplateRepo::new(pool);
        
        let mut template = create_test_template();
        repo.create_tide_template(&template).await?;
        
        template.goal_amount = 150.0;
        template.updated_at = time::OffsetDateTime::now_utc();
        repo.update_tide_template(&template).await?;
        
        let updated = repo.get_tide_template(&template.id).await?;
        assert!(updated.is_some());
        assert_eq!(updated.unwrap().goal_amount, 150.0);
        
        Ok(())
    }

    #[tokio::test]
    async fn test_delete_tide_template() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let repo = TideTemplateRepo::new(pool);
        
        let template = create_test_template();
        repo.create_tide_template(&template).await?;
        
        repo.delete_tide_template(&template.id).await?;
        
        let deleted = repo.get_tide_template(&template.id).await?;
        assert!(deleted.is_none());
        
        Ok(())
    }
}