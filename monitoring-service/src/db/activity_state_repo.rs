use crate::db::models::ActivityState;

#[derive(Clone)]
pub struct ActivityStateRepo {
    pool: sqlx::SqlitePool,
}

impl ActivityStateRepo {
    pub fn new(pool: sqlx::SqlitePool) -> Self {
        ActivityStateRepo { pool }
    }

    pub async fn save_activity_state(
        &self,
        activity_state: &ActivityState,
    ) -> Result<sqlx::sqlite::SqliteQueryResult, sqlx::Error> {
        let mut conn = self.pool.acquire().await?;
        sqlx::query!(
            r#"INSERT INTO activity_state (state, context_switches, start_time, end_time) 
        VALUES (?, ?, ?, ?)"#,
            activity_state.state as _, // Cast enum to database type
            activity_state.context_switches,
            activity_state.start_time,
            activity_state.end_time,
        )
        .execute(&mut *conn)
        .await
    }

    pub async fn get_activity_state(&self, id: i32) -> Result<ActivityState, sqlx::Error> {
        let mut conn = self.pool.acquire().await?;
        sqlx::query_as!(
            ActivityState,
            "SELECT * FROM activity_state WHERE id = ?",
            id
        )
        .fetch_one(&mut *conn)
        .await
    }
}

#[cfg(test)]
mod tests {
    use crate::db::{activity_state_repo::ActivityStateRepo, db_manager, models::ActivityState};
    #[tokio::test]
    async fn test_activity_state_repo() {
        let pool = db_manager::create_test_db().await;
        let activity_state_repo = ActivityStateRepo::new(pool.clone());
        let activity_state = ActivityState::new();
        activity_state_repo
            .save_activity_state(&activity_state)
            .await
            .unwrap();
    }
}
