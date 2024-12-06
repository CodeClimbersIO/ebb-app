// activities repo is responsible for all the database operations related to activities. Makes use of the db manager to get the pool and execute queries.

use crate::db::db_manager::DbManager;

use super::models::Activity;

pub struct ActivitiesRepo {
    db_manager: DbManager,
}

impl ActivitiesRepo {
    pub fn new(db_manager: DbManager) -> Self {
        ActivitiesRepo { db_manager }
    }

    pub async fn save_activity(
        &self,
        activity: &Activity,
    ) -> Result<sqlx::sqlite::SqliteQueryResult, sqlx::Error> {
        let mut conn = self.db_manager.pool.acquire().await?;
        sqlx::query!(
            r#"INSERT INTO activities (activity_type, app_name, app_window_title, mouse_x, mouse_y) 
          VALUES (?, ?, ?, ?, ?)"#,
            activity.activity_type as _, // Cast enum to database type
            activity.app_name,
            activity.app_window_title,
            activity.mouse_x,
            activity.mouse_y
        )
        .execute(&mut *conn)
        .await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::db_manager;
    #[tokio::test]
    async fn test_activities_repo() {
        let db_path = db_manager::get_test_db_path();
        let db_manager = DbManager::new(&db_path).await.unwrap();
        let activities_repo = ActivitiesRepo::new(db_manager);
        let activity = Activity::__create_test_window();
        activities_repo.save_activity(&activity).await.unwrap();
    }
}
