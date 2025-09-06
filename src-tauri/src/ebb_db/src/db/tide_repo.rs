use sqlx::{Pool, Sqlite};
use time::OffsetDateTime;

use crate::db::models::tide::Tide;

pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;

pub struct TideRepo {
    pool: Pool<Sqlite>,
}

impl TideRepo {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    pub async fn create_tide(&self, tide: &Tide) -> Result<()> {
        sqlx::query(
            "INSERT INTO tide (id, start, end, metrics_type, tide_frequency, goal_amount, actual_amount, tide_template_id, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
        )
        .bind(&tide.id)
        .bind(&tide.start)
        .bind(&tide.end)
        .bind(&tide.metrics_type)
        .bind(&tide.tide_frequency)
        .bind(tide.goal_amount)
        .bind(tide.actual_amount)
        .bind(&tide.tide_template_id)
        .bind(&tide.created_at)
        .bind(&tide.updated_at)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_tide(&self, id: &str) -> Result<Option<Tide>> {
        let tide = sqlx::query_as::<_, Tide>("SELECT * FROM tide WHERE id = ?1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(tide)
    }

    pub async fn get_all_tides(&self) -> Result<Vec<Tide>> {
        let tides = sqlx::query_as::<_, Tide>("SELECT * FROM tide ORDER BY start DESC")
            .fetch_all(&self.pool)
            .await?;

        Ok(tides)
    }

    pub async fn get_active_tides(&self) -> Result<Vec<Tide>> {
        let tides = sqlx::query_as::<_, Tide>("SELECT * FROM tide WHERE end IS NULL ORDER BY start DESC")
            .fetch_all(&self.pool)
            .await?;

        Ok(tides)
    }

    pub async fn get_tides_by_template(&self, template_id: &str) -> Result<Vec<Tide>> {
        let tides = sqlx::query_as::<_, Tide>(
            "SELECT * FROM tide WHERE tide_template_id = ?1 ORDER BY start DESC"
        )
        .bind(template_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(tides)
    }

    pub async fn get_tides_in_date_range(
        &self,
        start: OffsetDateTime,
        end: OffsetDateTime,
    ) -> Result<Vec<Tide>> {
        let tides = sqlx::query_as::<_, Tide>(
            "SELECT * FROM tide WHERE start >= ?1 AND start <= ?2 ORDER BY start DESC"
        )
        .bind(start)
        .bind(end)
        .fetch_all(&self.pool)
        .await?;

        Ok(tides)
    }

    pub async fn update_tide(&self, tide: &Tide) -> Result<()> {
        sqlx::query(
            "UPDATE tide 
             SET start = ?2, end = ?3, metrics_type = ?4, tide_frequency = ?5, 
                 goal_amount = ?6, actual_amount = ?7, tide_template_id = ?8, updated_at = ?9
             WHERE id = ?1"
        )
        .bind(&tide.id)
        .bind(&tide.start)
        .bind(&tide.end)
        .bind(&tide.metrics_type)
        .bind(&tide.tide_frequency)
        .bind(tide.goal_amount)
        .bind(tide.actual_amount)
        .bind(&tide.tide_template_id)
        .bind(&tide.updated_at)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn update_actual_amount(&self, id: &str, actual_amount: f64) -> Result<()> {
        sqlx::query(
            "UPDATE tide SET actual_amount = ?2, updated_at = ?3 WHERE id = ?1"
        )
        .bind(id)
        .bind(actual_amount)
        .bind(OffsetDateTime::now_utc())
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn end_tide(&self, id: &str, end_time: OffsetDateTime) -> Result<()> {
        sqlx::query(
            "UPDATE tide SET end = ?2, updated_at = ?3 WHERE id = ?1"
        )
        .bind(id)
        .bind(end_time)
        .bind(OffsetDateTime::now_utc())
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn delete_tide(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM tide WHERE id = ?1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use crate::db_manager;
    use crate::db::models::tide_template::TideTemplate;
    use crate::db::tide_template_repo::TideTemplateRepo;

    use super::*;

    #[tokio::test]
    async fn test_create_and_get_tide() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        let template = TideTemplate::new("creating".to_string(), "daily".to_string(), 100.0);
        template_repo.create_tide_template(&template).await?;
        
        let tide = Tide::from_template(&template, OffsetDateTime::now_utc());
        tide_repo.create_tide(&tide).await?;
        
        let retrieved = tide_repo.get_tide(&tide.id).await?;
        assert!(retrieved.is_some());
        let retrieved = retrieved.unwrap();
        assert_eq!(retrieved.id, tide.id);
        assert_eq!(retrieved.metrics_type, "creating");
        assert_eq!(retrieved.tide_frequency, "daily");
        assert_eq!(retrieved.goal_amount, 100.0);
        assert_eq!(retrieved.actual_amount, 0.0);
        
        Ok(())
    }

    #[tokio::test]
    async fn test_get_active_tides() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        let template = TideTemplate::new("creating".to_string(), "daily".to_string(), 100.0);
        template_repo.create_tide_template(&template).await?;
        
        let mut tide1 = Tide::from_template(&template, OffsetDateTime::now_utc());
        let tide2 = Tide::from_template(&template, OffsetDateTime::now_utc());
        
        // End one tide
        tide1.end = Some(OffsetDateTime::now_utc());
        
        tide_repo.create_tide(&tide1).await?;
        tide_repo.create_tide(&tide2).await?;
        
        let active_tides = tide_repo.get_active_tides().await?;
        assert_eq!(active_tides.len(), 1);
        assert_eq!(active_tides[0].id, tide2.id);
        
        Ok(())
    }

    #[tokio::test]
    async fn test_update_actual_amount() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        let template = TideTemplate::new("creating".to_string(), "daily".to_string(), 100.0);
        template_repo.create_tide_template(&template).await?;
        
        let tide = Tide::from_template(&template, OffsetDateTime::now_utc());
        tide_repo.create_tide(&tide).await?;
        
        tide_repo.update_actual_amount(&tide.id, 50.0).await?;
        
        let updated = tide_repo.get_tide(&tide.id).await?;
        assert!(updated.is_some());
        assert_eq!(updated.unwrap().actual_amount, 50.0);
        
        Ok(())
    }

    #[tokio::test]
    async fn test_end_tide() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        let template = TideTemplate::new("creating".to_string(), "daily".to_string(), 100.0);
        template_repo.create_tide_template(&template).await?;
        
        let tide = Tide::from_template(&template, OffsetDateTime::now_utc());
        tide_repo.create_tide(&tide).await?;
        
        let end_time = OffsetDateTime::now_utc();
        tide_repo.end_tide(&tide.id, end_time).await?;
        
        let ended = tide_repo.get_tide(&tide.id).await?;
        assert!(ended.is_some());
        assert!(ended.unwrap().end.is_some());
        
        Ok(())
    }

    #[tokio::test]
    async fn test_get_tides_by_template() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        let template1 = TideTemplate::new("creating".to_string(), "daily".to_string(), 100.0);
        let template2 = TideTemplate::new("learning".to_string(), "weekly".to_string(), 500.0);
        
        template_repo.create_tide_template(&template1).await?;
        template_repo.create_tide_template(&template2).await?;
        
        let tide1 = Tide::from_template(&template1, OffsetDateTime::now_utc());
        let tide2 = Tide::from_template(&template1, OffsetDateTime::now_utc());
        let tide3 = Tide::from_template(&template2, OffsetDateTime::now_utc());
        
        tide_repo.create_tide(&tide1).await?;
        tide_repo.create_tide(&tide2).await?;
        tide_repo.create_tide(&tide3).await?;
        
        let template1_tides = tide_repo.get_tides_by_template(&template1.id).await?;
        assert_eq!(template1_tides.len(), 2);
        
        let template2_tides = tide_repo.get_tides_by_template(&template2.id).await?;
        assert_eq!(template2_tides.len(), 1);
        
        Ok(())
    }
}