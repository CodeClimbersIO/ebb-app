// activities repo is responsible for all the database operations related to activities. Makes use of the db manager to get the pool and execute queries.

use super::models::Activity;
#[derive(Clone)]
pub struct ActivitiesRepo {
    pool: sqlx::SqlitePool,
}

impl ActivitiesRepo {
    pub fn new(pool: sqlx::SqlitePool) -> Self {
        ActivitiesRepo { pool }
    }

    pub async fn save_activity(
        &self,
        activity: &Activity,
    ) -> Result<sqlx::sqlite::SqliteQueryResult, sqlx::Error> {
        let mut conn = self.pool.acquire().await?;
        sqlx::query!(
            r#"INSERT INTO activities (activity_type, app_name, app_window_title) 
          VALUES (?, ?, ?)"#,
            activity.activity_type as _, // Cast enum to database type
            activity.app_name,
            activity.app_window_title,
        )
        .execute(&mut *conn)
        .await
    }

    pub async fn get_activity(&self, id: i32) -> Result<Activity, sqlx::Error> {
        let mut conn = self.pool.acquire().await?;
        sqlx::query_as!(Activity, "SELECT * FROM activities WHERE id = ?", id)
            .fetch_one(&mut *conn)
            .await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::db_manager;
    #[tokio::test]
    async fn test_activities_repo() {
        let pool = db_manager::create_test_db().await;
        let activities_repo = ActivitiesRepo::new(pool);
        let activity = Activity::__create_test_window();
        activities_repo.save_activity(&activity).await.unwrap();
    }
}
