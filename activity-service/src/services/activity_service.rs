// activity service provides an interface to read/write to the activities table

use crate::db::{activities_repo::ActivitiesRepo, db_manager::DbManager, models::Activity};

pub struct ActivityService {
    activities_repo: ActivitiesRepo,
}

impl ActivityService {
    pub fn new(db_manager: DbManager) -> Self {
        ActivityService {
            activities_repo: ActivitiesRepo::new(db_manager),
        }
    }

    pub async fn save_activity(
        &self,
        activity: &Activity,
    ) -> Result<sqlx::sqlite::SqliteQueryResult, sqlx::Error> {
        self.activities_repo.save_activity(activity).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::db_manager;

    #[tokio::test]
    async fn test_activity_service() {
        let db_path = db_manager::get_db_path();
        let db_manager = DbManager::new(&db_path).await.unwrap();
        let activity_service = ActivityService::new(db_manager);
        let activity = Activity::__create_test_window();

        activity_service.save_activity(&activity).await.unwrap();
    }
}
