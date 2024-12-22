use std::time::Duration;

use time::OffsetDateTime;

use crate::db::models::{ActivityState, ActivityStateType};

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
            r#"INSERT INTO activity_state (state, app_switches, start_time, end_time) 
        VALUES (?, ?, ?, ?)"#,
            activity_state.state as _, // Cast enum to database type
            activity_state.app_switches,
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

    pub async fn get_last_activity_state(&self) -> Result<ActivityState, sqlx::Error> {
        let mut conn = self.pool.acquire().await?;
        sqlx::query_as!(
            ActivityState,
            "SELECT * FROM activity_state ORDER BY id DESC LIMIT 1",
        )
        .fetch_one(&mut *conn)
        .await
    }

    pub async fn get_next_activity_state_times(
        &self,
        interval: Duration,
    ) -> (OffsetDateTime, OffsetDateTime) {
        let (start_time, end_time) = match self.get_last_activity_state().await {
            Ok(last_state) => {
                let start_time = if last_state.end_time.unwrap_or(OffsetDateTime::now_utc())
                    + Duration::from_secs(5)
                    < OffsetDateTime::now_utc()
                {
                    println!("start time is now");
                    OffsetDateTime::now_utc()
                } else {
                    println!("start time is last state end time");
                    last_state.end_time.unwrap_or(OffsetDateTime::now_utc())
                };
                (start_time, OffsetDateTime::now_utc() + interval)
            }
            Err(sqlx::Error::RowNotFound) => {
                println!("no last activity state");
                let now = OffsetDateTime::now_utc();
                (now - interval, now)
            }
            Err(e) => panic!("Database error: {}", e),
        };
        (start_time, end_time)
    }

    pub async fn get_activity_states_starting_between(
        &self,
        start_time: OffsetDateTime,
        end_time: OffsetDateTime,
    ) -> Result<Vec<ActivityState>, sqlx::Error> {
        let mut conn = self.pool.acquire().await?;
        sqlx::query_as!(
            ActivityState,
            "SELECT * FROM activity_state WHERE start_time >= ? AND start_time <= ?",
            start_time,
            end_time,
        )
        .fetch_all(&mut *conn)
        .await
    }

    pub(crate) async fn create_idle_activity_state(
        &self,
        interval: Duration,
    ) -> Result<sqlx::sqlite::SqliteQueryResult, sqlx::Error> {
        let (start_time, end_time) = self.get_next_activity_state_times(interval).await;
        let mut conn = self.pool.acquire().await.unwrap();

        sqlx::query!(
            r#"INSERT INTO activity_state (state, app_switches, start_time, end_time)
        VALUES (?, ?, ?, ?)"#,
            ActivityStateType::Inactive as _,
            0,
            start_time,
            end_time,
        )
        .execute(&mut *conn)
        .await
    }

    pub(crate) async fn create_active_activity_state(
        &self,
        app_switches: i64,
        interval: Duration,
    ) -> Result<sqlx::sqlite::SqliteQueryResult, sqlx::Error> {
        let (start_time, end_time) = self.get_next_activity_state_times(interval).await;
        let mut conn = self.pool.acquire().await?;
        sqlx::query!(
            r#"INSERT INTO activity_state (state, app_switches, start_time, end_time) 
        VALUES (?, ?, ?, ?)"#,
            ActivityStateType::Active as _,
            app_switches,
            start_time,
            end_time,
        )
        .execute(&mut *conn)
        .await
    }
}

#[cfg(test)]
mod tests {
    use std::time::Duration;

    use time::OffsetDateTime;

    use crate::db::{
        activity_state_repo::ActivityStateRepo,
        db_manager,
        models::{ActivityState, ActivityStateType},
    };
    use crate::utils::test_utils::assert_datetime_eq;

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

    #[tokio::test]
    async fn test_create_idle_activity_state() {
        let pool = db_manager::create_test_db().await;
        let activity_state_repo = ActivityStateRepo::new(pool.clone());
        activity_state_repo
            .create_idle_activity_state(Duration::from_secs(120))
            .await
            .unwrap();
        let first_activity_state = activity_state_repo.get_last_activity_state().await.unwrap();
        assert_eq!(first_activity_state.state, ActivityStateType::Inactive);
        assert_eq!(first_activity_state.app_switches, 0);
    }

    #[tokio::test]
    async fn test_create_active_activity_state() {
        let pool = db_manager::create_test_db().await;
        let activity_state_repo = ActivityStateRepo::new(pool.clone());
        activity_state_repo
            .create_active_activity_state(5, Duration::from_secs(120))
            .await
            .unwrap();
        let last_activity_state = activity_state_repo.get_last_activity_state().await.unwrap();
        assert_eq!(last_activity_state.state, ActivityStateType::Active);
        assert_eq!(last_activity_state.app_switches, 5);
    }

    #[tokio::test]
    async fn test_get_next_activity_state_times_no_last_activity_state() {
        let pool = db_manager::create_test_db().await;
        let activity_state_repo = ActivityStateRepo::new(pool.clone());
        let (start_time, end_time) = activity_state_repo
            .get_next_activity_state_times(Duration::from_secs(120))
            .await;

        assert_datetime_eq(
            start_time,
            OffsetDateTime::now_utc() - Duration::from_secs(120),
            Duration::from_millis(1),
        );
        assert_datetime_eq(
            end_time,
            OffsetDateTime::now_utc(),
            Duration::from_millis(1),
        );
    }

    #[tokio::test]
    async fn test_get_next_activity_state_times_last_activity_state_within_5_seconds() {
        let pool = db_manager::create_test_db().await;
        let activity_state_repo = ActivityStateRepo::new(pool.clone());
        // create activity state with an end time within 5 seconds of now
        let mut activity_state = ActivityState::new();
        activity_state.start_time = Some(OffsetDateTime::now_utc() - Duration::from_secs(122));
        activity_state.end_time = Some(OffsetDateTime::now_utc() + Duration::from_secs(1));
        activity_state_repo
            .save_activity_state(&activity_state)
            .await
            .unwrap();

        let (start_time, end_time) = activity_state_repo
            .get_next_activity_state_times(Duration::from_secs(120))
            .await;
        assert_datetime_eq(
            start_time,
            activity_state.end_time.unwrap(),
            Duration::from_millis(1),
        );
        assert_datetime_eq(
            end_time,
            OffsetDateTime::now_utc() + Duration::from_secs(120),
            Duration::from_millis(1),
        );
    }

    #[tokio::test]
    async fn test_get_next_activity_state_times_last_activity_state_not_within_5_seconds() {
        let pool = db_manager::create_test_db().await;
        let activity_state_repo = ActivityStateRepo::new(pool.clone());
        // create activity state with an end time not within 5 seconds of now
        let mut activity_state = ActivityState::new();
        activity_state.start_time = Some(OffsetDateTime::now_utc() - Duration::from_secs(130));
        activity_state.end_time = Some(OffsetDateTime::now_utc() - Duration::from_secs(10));
        activity_state_repo
            .save_activity_state(&activity_state)
            .await
            .unwrap();

        let (start_time, end_time) = activity_state_repo
            .get_next_activity_state_times(Duration::from_secs(120))
            .await;
        assert_datetime_eq(
            start_time,
            OffsetDateTime::now_utc(),
            Duration::from_millis(1),
        );
        assert_datetime_eq(
            end_time,
            OffsetDateTime::now_utc() + Duration::from_secs(120),
            Duration::from_millis(1),
        );
    }
}
