use std::time::Duration;

use time::OffsetDateTime;

use crate::db::activity_state_repo::ActivityStateRepo;

#[derive(Clone, Debug)]
pub struct ActivityPeriod {
    pub start_time: OffsetDateTime,
    pub end_time: OffsetDateTime,
}

#[derive(Clone)]
pub struct ActivityStateService {
    activity_state_repo: ActivityStateRepo,
}

impl ActivityStateService {
    pub fn new(pool: sqlx::SqlitePool) -> Self {
        ActivityStateService {
            activity_state_repo: ActivityStateRepo::new(pool.clone()),
        }
    }

    pub async fn get_next_activity_state_times(&self, interval: Duration) -> ActivityPeriod {
        let (start_time, end_time) = match self.activity_state_repo.get_last_activity_state().await
        {
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
        ActivityPeriod {
            start_time,
            end_time,
        }
    }
}

#[cfg(test)]
mod tests {
    use std::time::Duration;

    use crate::{
        db::{db_manager, models::ActivityState},
        utils::test_utils::assert_datetime_eq,
    };

    use super::*;

    #[tokio::test]
    async fn test_get_next_activity_state_times_no_last_activity_state() {
        let pool = db_manager::create_test_db().await;
        let activity_state_service = ActivityStateService::new(pool.clone());
        let activity_period = activity_state_service
            .get_next_activity_state_times(Duration::from_secs(120))
            .await;

        assert_datetime_eq(
            activity_period.start_time,
            OffsetDateTime::now_utc() - Duration::from_secs(120),
            Duration::from_millis(1),
        );
        assert_datetime_eq(
            activity_period.end_time,
            OffsetDateTime::now_utc(),
            Duration::from_millis(1),
        );
    }

    #[tokio::test]
    async fn test_get_next_activity_state_times_last_activity_state_within_5_seconds() {
        let pool = db_manager::create_test_db().await;
        let activity_state_service = ActivityStateService::new(pool.clone());
        let activity_state_repo = ActivityStateRepo::new(pool.clone());
        // create activity state with an end time within 5 seconds of now
        let mut activity_state = ActivityState::new();
        activity_state.start_time = Some(OffsetDateTime::now_utc() - Duration::from_secs(122));
        activity_state.end_time = Some(OffsetDateTime::now_utc() + Duration::from_secs(1));
        activity_state_repo
            .save_activity_state(&activity_state)
            .await
            .unwrap();

        let activity_period = activity_state_service
            .get_next_activity_state_times(Duration::from_secs(120))
            .await;
        assert_datetime_eq(
            activity_period.start_time,
            activity_state.end_time.unwrap(),
            Duration::from_millis(1),
        );
        assert_datetime_eq(
            activity_period.end_time,
            OffsetDateTime::now_utc() + Duration::from_secs(120),
            Duration::from_millis(1),
        );
    }

    #[tokio::test]
    async fn test_get_next_activity_state_times_last_activity_state_not_within_5_seconds() {
        let pool = db_manager::create_test_db().await;
        let activity_state_service = ActivityStateService::new(pool.clone());
        let activity_state_repo = ActivityStateRepo::new(pool.clone());

        // create activity state with an end time not within 5 seconds of now
        let mut activity_state = ActivityState::new();
        activity_state.start_time = Some(OffsetDateTime::now_utc() - Duration::from_secs(130));
        activity_state.end_time = Some(OffsetDateTime::now_utc() - Duration::from_secs(10));
        activity_state_repo
            .save_activity_state(&activity_state)
            .await
            .unwrap();

        let activity_period = activity_state_service
            .get_next_activity_state_times(Duration::from_secs(120))
            .await;
        assert_datetime_eq(
            activity_period.start_time,
            OffsetDateTime::now_utc(),
            Duration::from_millis(1),
        );
        assert_datetime_eq(
            activity_period.end_time,
            OffsetDateTime::now_utc() + Duration::from_secs(120),
            Duration::from_millis(1),
        );
    }
}
