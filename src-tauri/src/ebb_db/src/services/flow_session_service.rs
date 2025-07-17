use crate::db::flow_session_repo::{FlowSessionRepo, Result};
use crate::db_manager::DbManager;
use std::sync::Arc;

pub struct FlowSessionService {
    repo: FlowSessionRepo,
}

impl FlowSessionService {
    pub fn new(db_manager: Arc<DbManager>) -> Self {
        Self {
            repo: FlowSessionRepo::new(db_manager.pool.clone()),
        }
    }

    /// Check if there's an active hard mode session
    pub async fn is_hard_mode_session_active(&self) -> Result<bool> {
        self.repo.is_hard_mode_session_active().await
    }
}

#[cfg(test)]
mod tests {
    use crate::db_manager;
    use super::*;

    #[tokio::test]
    async fn test_is_hard_mode_session_active_service() -> Result<()> {
        let db_manager = Arc::new(db_manager::DbManager::new(":memory:").await.unwrap());
        let service = FlowSessionService::new(db_manager);

        let result = service.is_hard_mode_session_active().await?;
        assert!(!result);

        Ok(())
    }
}