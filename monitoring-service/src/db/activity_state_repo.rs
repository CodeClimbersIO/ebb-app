use time::OffsetDateTime;

use crate::{
    db::models::{ActivityState, ActivityStateType},
    services::activity_state_service::ActivityPeriod,
};

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

    pub async fn get_activity_states_for_activity_period(
        &self,
        activity_period: &ActivityPeriod,
    ) -> Result<Vec<ActivityState>, sqlx::Error> {
        let mut conn = self.pool.acquire().await?;
        sqlx::query_as!(
            ActivityState,
            "SELECT * FROM activity_state WHERE start_time >= ? AND start_time < ?",
            activity_period.start_time,
            activity_period.end_time,
        )
        .fetch_all(&mut *conn)
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
        activity_period: &ActivityPeriod,
    ) -> Result<sqlx::sqlite::SqliteQueryResult, sqlx::Error> {
        let (start_time, end_time) = (activity_period.start_time, activity_period.end_time);
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
        activity_period: &ActivityPeriod,
    ) -> Result<sqlx::sqlite::SqliteQueryResult, sqlx::Error> {
        let (start_time, end_time) = (activity_period.start_time, activity_period.end_time);
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

    use crate::utils::test_utils::assert_datetime_eq;
    use crate::{
        db::{
            activity_state_repo::ActivityStateRepo,
            db_manager,
            models::{ActivityState, ActivityStateType},
        },
        services::activity_state_service::ActivityPeriod,
    };

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
            .create_idle_activity_state(&ActivityPeriod {
                start_time: OffsetDateTime::now_utc(),
                end_time: OffsetDateTime::now_utc() + Duration::from_secs(120),
            })
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
            .create_active_activity_state(
                5,
                &ActivityPeriod {
                    start_time: OffsetDateTime::now_utc(),
                    end_time: OffsetDateTime::now_utc() + Duration::from_secs(120),
                },
            )
            .await
            .unwrap();
        let last_activity_state = activity_state_repo.get_last_activity_state().await.unwrap();
        assert_eq!(last_activity_state.state, ActivityStateType::Active);
        assert_eq!(last_activity_state.app_switches, 5);
    }

    /**
     * if we have activity states for 10:00 10:02, 10:04, 10:06, 10:08, 10:10, 10:02, 10:04
     * and we want to get the flow period for 10:02 - 10:12, we will find the activity states for 10:02, 10:04, 10:06, 10:08, 10:10
     */
    #[tokio::test]
    async fn test_get_activity_states_for_activity_period() {
        let pool = db_manager::create_test_db().await;
        let activity_state_repo = ActivityStateRepo::new(pool.clone());

        // Create a base time at 10:00
        let base_time = OffsetDateTime::now_utc()
            .replace_hour(10)
            .unwrap()
            .replace_minute(0)
            .unwrap()
            .replace_second(0)
            .unwrap()
            .replace_nanosecond(0)
            .unwrap();

        // Create activity states at 2-minute intervals
        let times = [0, 2, 4, 6, 8, 10, 12, 14];
        for minutes in times {
            let mut activity_state = ActivityState::new();
            activity_state.start_time = Some(base_time + Duration::from_secs(minutes * 60));
            activity_state.end_time = Some(base_time + Duration::from_secs((minutes + 2) * 60));
            activity_state_repo
                .save_activity_state(&activity_state)
                .await
                .unwrap();
        }

        // Create an activity period from 10:02 to 10:12
        let activity_period = ActivityPeriod {
            start_time: base_time + Duration::from_secs(2 * 60),
            end_time: base_time + Duration::from_secs(12 * 60),
        };

        // Get activity states for the period
        let result = activity_state_repo
            .get_activity_states_for_activity_period(&activity_period)
            .await
            .unwrap();

        // Should return 5 activity states (10:02, 10:04, 10:06, 10:08, 10:10)
        assert_eq!(result.len(), 5);

        // Verify the timestamps of returned activity states
        for (i, state) in result.iter().enumerate() {
            let expected_start = base_time + Duration::from_secs((i as u64 + 1) * 2 * 60);
            assert_datetime_eq(
                state.start_time.unwrap(),
                expected_start,
                Duration::from_millis(1),
            );
        }
    }
}
