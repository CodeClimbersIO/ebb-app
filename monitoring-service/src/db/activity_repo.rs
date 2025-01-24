// activity repo is responsible for all the database operations related to activities. Makes use of the db manager to get the pool and execute queries.

use super::models::Activity;
#[derive(Clone)]
pub struct ActivityRepo {
    pool: sqlx::SqlitePool,
}

impl ActivityRepo {
    pub fn new(pool: sqlx::SqlitePool) -> Self {
        ActivityRepo { pool }
    }

    pub async fn save_activity(
        &self,
        activity: &Activity,
    ) -> Result<sqlx::sqlite::SqliteQueryResult, sqlx::Error> {
        let mut conn = self.pool.acquire().await?;
        sqlx::query!(
            r#"INSERT INTO activity (activity_type, app_name, app_window_title, url, timestamp) 
          VALUES (?, ?, ?, ?, ?)"#,
            activity.activity_type as _, // Cast enum to database type
            activity.app_name,
            activity.app_window_title,
            activity.url,
            activity.timestamp,
        )
        .execute(&mut *conn)
        .await
    }

    pub async fn get_activity(&self, id: i32) -> Result<Activity, sqlx::Error> {
        let mut conn = self.pool.acquire().await?;
        sqlx::query_as!(Activity, "SELECT * FROM activity WHERE id = ?", id)
            .fetch_one(&mut *conn)
            .await
    }

    // get the activities since the last activity state. If none, return an empty vector.
    pub(crate) async fn get_activities_since_last_activity_state(
        &self,
    ) -> Result<Vec<Activity>, sqlx::Error> {
        let mut conn = self.pool.acquire().await?;
        sqlx::query_as!(Activity, 
            r#"
            SELECT * FROM activity WHERE timestamp > (SELECT start_time FROM activity_state WHERE id = (SELECT MAX(id) FROM activity_state))
            ORDER BY timestamp ASC
            "#)
            .fetch_all(&mut *conn)
            .await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::db_manager;
    #[tokio::test]
    async fn test_activity_repo() {
        let pool = db_manager::create_test_db().await;
        let activity_repo = ActivityRepo::new(pool);
        let activity = Activity::__create_test_window();
        activity_repo.save_activity(&activity).await.unwrap();
    }

}
