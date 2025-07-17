use sqlx::{Pool, Sqlite};

pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;

pub struct FlowSessionRepo {
    pool: Pool<Sqlite>,
}

impl FlowSessionRepo {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    /// Check if there's an active hard mode session
    pub async fn is_hard_mode_session_active(&self) -> Result<bool> {
        let result: Option<(String,)> = sqlx::query_as(
            "SELECT fs.id FROM flow_session fs 
             JOIN workflow w ON fs.workflow_id = w.id 
             WHERE fs.end IS NULL 
             AND JSON_EXTRACT(w.settings, '$.difficulty') = 'hard'
             LIMIT 1"
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(result.is_some())
    }
}

#[cfg(test)]
mod tests {
    use crate::db_manager;
    use super::*;

    #[tokio::test]
    async fn test_is_hard_mode_session_active_false() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let repo = FlowSessionRepo::new(pool);

        let result = repo.is_hard_mode_session_active().await?;
        assert!(!result);

        Ok(())
    }
}