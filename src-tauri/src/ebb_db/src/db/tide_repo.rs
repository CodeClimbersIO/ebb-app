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
            "INSERT INTO tide (id, start, end, completed_at, metrics_type, tide_frequency, goal_amount, actual_amount, tide_template_id, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)"
        )
        .bind(&tide.id)
        .bind(&tide.start)
        .bind(&tide.end)
        .bind(&tide.completed_at)
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
        let now = OffsetDateTime::now_utc();
        self.get_active_tides_at(now).await
    }

    pub async fn get_active_tides_at(&self, evaluation_time: OffsetDateTime) -> Result<Vec<Tide>> {
        let tides = sqlx::query_as::<_, Tide>(
            "SELECT * FROM tide WHERE start <= ?1 AND (end IS NULL OR end >= ?1) ORDER BY start DESC"
        )
        .bind(evaluation_time)
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
             SET start = ?2, end = ?3, completed_at = ?4, metrics_type = ?5, tide_frequency = ?6, 
                 goal_amount = ?7, actual_amount = ?8, tide_template_id = ?9, updated_at = ?10
             WHERE id = ?1"
        )
        .bind(&tide.id)
        .bind(&tide.start)
        .bind(&tide.end)
        .bind(&tide.completed_at)
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

    pub async fn complete_tide(&self, id: &str) -> Result<()> {
        let now = OffsetDateTime::now_utc();
        sqlx::query(
            "UPDATE tide SET completed_at = ?2, updated_at = ?3 WHERE id = ?1"
        )
        .bind(id)
        .bind(now)
        .bind(now)
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

    /// Get the latest tide end time for a specific template
    /// Returns None if no tides exist for the template or if all tides have NULL end times
    pub async fn get_latest_tide_end_for_template(&self, template_id: &str) -> Result<Option<OffsetDateTime>> {
        let result = sqlx::query_scalar::<_, Option<OffsetDateTime>>(
            "SELECT MAX(end) FROM tide WHERE tide_template_id = ?1 AND end IS NOT NULL"
        )
        .bind(template_id)
        .fetch_one(&self.pool)
        .await?;

        Ok(result)
    }

    /// Check if a template has any tide that starts within the specified date range
    /// This is used to prevent creating duplicate tides during backfill operations
    pub async fn has_tide_for_date_range(
        &self,
        template_id: &str,
        range_start: OffsetDateTime,
        range_end: OffsetDateTime,
    ) -> Result<bool> {
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM tide WHERE tide_template_id = ?1 AND start >= ?2 AND start < ?3"
        )
        .bind(template_id)
        .bind(range_start)
        .bind(range_end)
        .fetch_one(&self.pool)
        .await?;

        Ok(count > 0)
    }
}

#[cfg(test)]
mod tests {
    use crate::db_manager;
    use crate::db::models::tide_template::TideTemplate;
    use crate::db::tide_template_repo::TideTemplateRepo;
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
    async fn test_create_and_get_tide() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        let template = create_test_template();
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
        
        let template = create_test_template();
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
        
        let template = create_test_template();
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
        
        let template = create_test_template();
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
        
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template1 = TideTemplate::new("creating".to_string(), "daily".to_string(), 100.0, first_tide, None);
        let template2 = TideTemplate::new("learning".to_string(), "weekly".to_string(), 500.0, first_tide, None);
        
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

    #[tokio::test]
    async fn test_get_latest_tide_end_for_template_no_tides() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        let template = create_test_template();
        template_repo.create_tide_template(&template).await?;
        
        // No tides exist for this template
        let latest_end = tide_repo.get_latest_tide_end_for_template(&template.id).await?;
        assert!(latest_end.is_none());
        
        Ok(())
    }

    #[tokio::test]
    async fn test_get_latest_tide_end_for_template_single_tide() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        let template = create_test_template();
        template_repo.create_tide_template(&template).await?;
        
        let tide = Tide::from_template(&template, OffsetDateTime::now_utc());
        tide_repo.create_tide(&tide).await?;
        
        let latest_end = tide_repo.get_latest_tide_end_for_template(&template.id).await?;
        assert!(latest_end.is_some());
        assert_eq!(latest_end.unwrap(), tide.end.unwrap());
        
        Ok(())
    }

    #[tokio::test]
    async fn test_get_latest_tide_end_for_template_multiple_tides() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        let template = create_test_template();
        template_repo.create_tide_template(&template).await?;
        
        let now = OffsetDateTime::now_utc();
        
        // Create multiple tides with different end times
        let tide1 = Tide::from_template(&template, now - time::Duration::days(3));
        let tide2 = Tide::from_template(&template, now - time::Duration::days(2)); 
        let tide3 = Tide::from_template(&template, now - time::Duration::days(1));
        
        tide_repo.create_tide(&tide1).await?;
        tide_repo.create_tide(&tide2).await?;
        tide_repo.create_tide(&tide3).await?;
        
        let latest_end = tide_repo.get_latest_tide_end_for_template(&template.id).await?;
        assert!(latest_end.is_some());
        // Should return the latest (most recent) end time
        assert_eq!(latest_end.unwrap(), tide3.end.unwrap());
        
        Ok(())
    }

    #[tokio::test]
    async fn test_get_latest_tide_end_for_template_with_null_end() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        let template = create_test_template();
        template_repo.create_tide_template(&template).await?;
        
        let now = OffsetDateTime::now_utc();
        
        // Create one tide with end time and one indefinite tide (end = None)
        let tide_with_end = Tide::from_template(&template, now - time::Duration::days(2));
        let mut indefinite_tide = Tide::from_template(&template, now - time::Duration::days(1));
        indefinite_tide.end = None; // Indefinite tide
        
        tide_repo.create_tide(&tide_with_end).await?;
        tide_repo.create_tide(&indefinite_tide).await?;
        
        let latest_end = tide_repo.get_latest_tide_end_for_template(&template.id).await?;
        assert!(latest_end.is_some());
        // Should return the end time from tide_with_end (ignoring NULL end times)
        assert_eq!(latest_end.unwrap(), tide_with_end.end.unwrap());
        
        Ok(())
    }

    #[tokio::test]
    async fn test_get_latest_tide_end_for_template_only_null_ends() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        let template = create_test_template();
        template_repo.create_tide_template(&template).await?;
        
        // Create multiple indefinite tides (all end = None)
        let mut tide1 = Tide::from_template(&template, OffsetDateTime::now_utc() - time::Duration::days(3));
        let mut tide2 = Tide::from_template(&template, OffsetDateTime::now_utc() - time::Duration::days(2));
        tide1.end = None;
        tide2.end = None;
        
        tide_repo.create_tide(&tide1).await?;
        tide_repo.create_tide(&tide2).await?;
        
        let latest_end = tide_repo.get_latest_tide_end_for_template(&template.id).await?;
        assert!(latest_end.is_none()); // Should return None when all end times are NULL
        
        Ok(())
    }

    #[tokio::test]
    async fn test_get_latest_tide_end_for_template_different_templates() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        // Create two different templates
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template1 = TideTemplate::new("creating".to_string(), "daily".to_string(), 100.0, first_tide, None);
        let template2 = TideTemplate::new("learning".to_string(), "weekly".to_string(), 500.0, first_tide, None);
        
        template_repo.create_tide_template(&template1).await?;
        template_repo.create_tide_template(&template2).await?;
        
        let now = OffsetDateTime::now_utc();
        
        // Create tides for template1 only
        let tide1 = Tide::from_template(&template1, now - time::Duration::days(2));
        let tide2 = Tide::from_template(&template1, now - time::Duration::days(1));
        
        tide_repo.create_tide(&tide1).await?;
        tide_repo.create_tide(&tide2).await?;
        
        // template1 should have latest end time
        let latest_end1 = tide_repo.get_latest_tide_end_for_template(&template1.id).await?;
        assert!(latest_end1.is_some());
        assert_eq!(latest_end1.unwrap(), tide2.end.unwrap());
        
        // template2 should have no tides
        let latest_end2 = tide_repo.get_latest_tide_end_for_template(&template2.id).await?;
        assert!(latest_end2.is_none());
        
        Ok(())
    }

    #[tokio::test]
    async fn test_has_tide_for_date_range_no_tides() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        let template = create_test_template();
        template_repo.create_tide_template(&template).await?;
        
        let range_start = datetime!(2025-01-01 00:00:00 UTC);
        let range_end = datetime!(2025-01-02 00:00:00 UTC);
        
        // No tides exist for this template
        let has_tide = tide_repo.has_tide_for_date_range(&template.id, range_start, range_end).await?;
        assert!(!has_tide);
        
        Ok(())
    }

    #[tokio::test]
    async fn test_has_tide_for_date_range_tide_within_range() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        let template = create_test_template();
        template_repo.create_tide_template(&template).await?;
        
        // Create a tide that starts within the range
        let tide_start = datetime!(2025-01-01 12:00:00 UTC);
        let tide = Tide::from_template(&template, tide_start);
        tide_repo.create_tide(&tide).await?;
        
        let range_start = datetime!(2025-01-01 00:00:00 UTC);
        let range_end = datetime!(2025-01-02 00:00:00 UTC);
        
        let has_tide = tide_repo.has_tide_for_date_range(&template.id, range_start, range_end).await?;
        assert!(has_tide);
        
        Ok(())
    }

    #[tokio::test]
    async fn test_has_tide_for_date_range_tide_before_range() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        let template = create_test_template();
        template_repo.create_tide_template(&template).await?;
        
        // Create a tide that starts before the range
        let tide_start = datetime!(2024-12-31 12:00:00 UTC);
        let tide = Tide::from_template(&template, tide_start);
        tide_repo.create_tide(&tide).await?;
        
        let range_start = datetime!(2025-01-01 00:00:00 UTC);
        let range_end = datetime!(2025-01-02 00:00:00 UTC);
        
        let has_tide = tide_repo.has_tide_for_date_range(&template.id, range_start, range_end).await?;
        assert!(!has_tide); // Tide starts before range, should not be found
        
        Ok(())
    }

    #[tokio::test]
    async fn test_has_tide_for_date_range_tide_after_range() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        let template = create_test_template();
        template_repo.create_tide_template(&template).await?;
        
        // Create a tide that starts after the range
        let tide_start = datetime!(2025-01-02 12:00:00 UTC);
        let tide = Tide::from_template(&template, tide_start);
        tide_repo.create_tide(&tide).await?;
        
        let range_start = datetime!(2025-01-01 00:00:00 UTC);
        let range_end = datetime!(2025-01-02 00:00:00 UTC);
        
        let has_tide = tide_repo.has_tide_for_date_range(&template.id, range_start, range_end).await?;
        assert!(!has_tide); // Tide starts at range_end, should not be included (start < range_end)
        
        Ok(())
    }

    #[tokio::test]
    async fn test_has_tide_for_date_range_tide_at_range_start() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        let template = create_test_template();
        template_repo.create_tide_template(&template).await?;
        
        // Create a tide that starts exactly at range_start
        let tide_start = datetime!(2025-01-01 00:00:00 UTC);
        let tide = Tide::from_template(&template, tide_start);
        tide_repo.create_tide(&tide).await?;
        
        let range_start = datetime!(2025-01-01 00:00:00 UTC);
        let range_end = datetime!(2025-01-02 00:00:00 UTC);
        
        let has_tide = tide_repo.has_tide_for_date_range(&template.id, range_start, range_end).await?;
        assert!(has_tide); // Tide starts at range_start, should be included (start >= range_start)
        
        Ok(())
    }

    #[tokio::test]
    async fn test_has_tide_for_date_range_multiple_tides() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        let template = create_test_template();
        template_repo.create_tide_template(&template).await?;
        
        // Create multiple tides - some in range, some outside
        let tide1 = Tide::from_template(&template, datetime!(2024-12-31 12:00:00 UTC)); // Before range
        let tide2 = Tide::from_template(&template, datetime!(2025-01-01 08:00:00 UTC)); // In range
        let tide3 = Tide::from_template(&template, datetime!(2025-01-01 16:00:00 UTC)); // In range
        let tide4 = Tide::from_template(&template, datetime!(2025-01-03 12:00:00 UTC)); // After range
        
        tide_repo.create_tide(&tide1).await?;
        tide_repo.create_tide(&tide2).await?;
        tide_repo.create_tide(&tide3).await?;
        tide_repo.create_tide(&tide4).await?;
        
        let range_start = datetime!(2025-01-01 00:00:00 UTC);
        let range_end = datetime!(2025-01-02 00:00:00 UTC);
        
        let has_tide = tide_repo.has_tide_for_date_range(&template.id, range_start, range_end).await?;
        assert!(has_tide); // Should find tide2 and tide3
        
        Ok(())
    }

    #[tokio::test]
    async fn test_has_tide_for_date_range_different_templates() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        // Create two different templates
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template1 = TideTemplate::new("creating".to_string(), "daily".to_string(), 100.0, first_tide, None);
        let template2 = TideTemplate::new("learning".to_string(), "weekly".to_string(), 500.0, first_tide, None);
        
        template_repo.create_tide_template(&template1).await?;
        template_repo.create_tide_template(&template2).await?;
        
        // Create a tide for template1 within the range
        let tide = Tide::from_template(&template1, datetime!(2025-01-01 12:00:00 UTC));
        tide_repo.create_tide(&tide).await?;
        
        let range_start = datetime!(2025-01-01 00:00:00 UTC);
        let range_end = datetime!(2025-01-02 00:00:00 UTC);
        
        // template1 should have a tide in the range
        let has_tide1 = tide_repo.has_tide_for_date_range(&template1.id, range_start, range_end).await?;
        assert!(has_tide1);
        
        // template2 should not have any tides in the range
        let has_tide2 = tide_repo.has_tide_for_date_range(&template2.id, range_start, range_end).await?;
        assert!(!has_tide2);
        
        Ok(())
    }

    #[tokio::test]
    async fn test_has_tide_for_date_range_precise_boundaries() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let tide_repo = TideRepo::new(pool.clone());
        let template_repo = TideTemplateRepo::new(pool);
        
        let template = create_test_template();
        template_repo.create_tide_template(&template).await?;
        
        // Test precise boundary conditions
        let range_start = datetime!(2025-01-01 10:00:00 UTC);
        let range_end = datetime!(2025-01-01 20:00:00 UTC);
        
        // Tide that starts exactly at range_end (should NOT be included)
        let tide_at_end = Tide::from_template(&template, range_end);
        tide_repo.create_tide(&tide_at_end).await?;
        
        let has_tide = tide_repo.has_tide_for_date_range(&template.id, range_start, range_end).await?;
        assert!(!has_tide); // Should not include tide that starts exactly at range_end
        
        Ok(())
    }
}