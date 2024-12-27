use std::time::Duration;

use time::OffsetDateTime;

use crate::db::{
    activity_flow_period_repo::ActivityFlowPeriodRepo,
    activity_state_repo::ActivityStateRepo,
    models::{ActivityFlowPeriod, ActivityState, ActivityStateType},
};

#[derive(Clone, Debug)]
pub struct ActivityPeriod {
    pub start_time: OffsetDateTime,
    pub end_time: OffsetDateTime,
}

#[derive(Clone)]
pub struct ActivityStateService {
    activity_state_repo: ActivityStateRepo,
    activity_flow_period_repo: ActivityFlowPeriodRepo,
}

impl ActivityStateService {
    pub fn new(pool: sqlx::SqlitePool) -> Self {
        ActivityStateService {
            activity_state_repo: ActivityStateRepo::new(pool.clone()),
            activity_flow_period_repo: ActivityFlowPeriodRepo::new(pool.clone()),
        }
    }

    /* we calculate the flow period based on the found activity_states between that period (inclusive).
     * For example, if we have activity states for 10:00 10:02, 10:04, 10:06, 10:08, 10:10, 10:02, 10:04
     * and we want to get the flow period for 10:02 - 10:12, we will find the activity states for 10:02, 10:04, 10:06, 10:08, 10:10, 10:12
     * and calculate the flow period based on the found activity states.
     * The score is between 0 and 10 and is calculated as follows:
     * 5 points for your activity state (starts at 5 and goes down by 1 for each inactive state)
     * 1 points for app switching
     * 4 points for your flow streak (if the activity state is above 5 and for each previous flow period that was above 5 * 2 up to 4 points)
     */
    pub async fn save_flow_period_for_activity_period(
        &self,
        activity_period: &ActivityPeriod,
    ) -> Result<ActivityFlowPeriod, sqlx::Error> {
        // let flow_period = self.activity_state_repo.get_flow_period_for_activity_period(activity_period).await?;
        let activity_states = self
            .activity_state_repo
            .get_activity_states_for_activity_period(&activity_period)
            .await
            .expect("failed to get activity states for the period");
        let last_activity_flow_period = match self
            .activity_flow_period_repo
            .get_last_activity_flow_period()
            .await
        {
            Ok(period) => period,
            Err(sqlx::Error::RowNotFound) => ActivityFlowPeriod {
                id: None,
                start_time: Some(activity_period.start_time),
                end_time: Some(activity_period.end_time),
                score: 0.0,
                app_switches: 0,
                inactive_time: 0,
                created_at: OffsetDateTime::now_utc(),
            },
            Err(e) => return Err(e),
        };
        let mut flow_period = ActivityFlowPeriod {
            id: None,
            start_time: Some(activity_period.start_time),
            end_time: Some(activity_period.end_time),
            score: 0.0,
            app_switches: 0,
            inactive_time: 0,
            created_at: OffsetDateTime::now_utc(),
        };

        // calculate the activity score
        let activity_score = self.get_activity_score_for_activity_states(&activity_states);
        let app_switch_score = self.get_app_switch_score_for_activity_states(&activity_states);
        let flow_streak_score =
            self.get_flow_streak_score_for_activity_states(&last_activity_flow_period);

        let total_score = f64::min(activity_score + app_switch_score + flow_streak_score, 10.0);
        flow_period.score = total_score;

        self.activity_flow_period_repo
            .save_activity_flow_period(&flow_period)
            .await
            .expect("failed to save activity flow period");
        Ok(flow_period)
    }

    pub async fn get_next_activity_flow_period_times(&self, interval: Duration) -> ActivityPeriod {
        let (start_time, end_time) = match self
            .activity_flow_period_repo
            .get_last_activity_flow_period()
            .await
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

    #[cfg(test)]
    pub async fn get_activity_flow_periods_between(
        &self,
        start_time: OffsetDateTime,
        end_time: OffsetDateTime,
    ) -> Result<Vec<ActivityFlowPeriod>, sqlx::Error> {
        self.activity_flow_period_repo
            .get_activity_flow_periods_starting_between(start_time, end_time)
            .await
    }

    pub fn get_activity_score_for_activity_states(
        &self,
        activity_states: &Vec<ActivityState>,
    ) -> f64 {
        let inactive_states = activity_states
            .iter()
            .filter(|state| state.state == ActivityStateType::Inactive)
            .count();
        let activity_score = std::cmp::max(0, 5 - inactive_states as i32);
        activity_score as f64
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

    pub fn get_app_switch_score_for_activity_states(
        &self,
        activity_states: &Vec<ActivityState>,
    ) -> f64 {
        if activity_states.is_empty() {
            return 0.0;
        } else {
            let app_switch_avg = activity_states
                .iter()
                .map(|state| state.app_switches)
                .sum::<i64>() as f64
                / activity_states.len() as f64;
            match app_switch_avg {
                0.0..=4.0 => 1.0,
                5.0..=8.0 => 0.5,
                _ => 0.0,
            }
        }
    }

    pub fn get_flow_streak_score_for_activity_states(
        &self,
        last_activity_flow_period: &ActivityFlowPeriod,
    ) -> f64 {
        if last_activity_flow_period.score >= 5.0 {
            let flow_streak_score = f64::min(last_activity_flow_period.score + 2.0, 10.0);
            flow_streak_score
        } else {
            0.0
        }
    }
}

#[cfg(test)]
mod tests {
    use std::time::Duration;

    use crate::{
        db::{
            db_manager,
            models::{ActivityState, ActivityStateType},
        },
        utils::test_utils::assert_datetime_eq,
    };

    use super::*;

    #[tokio::test]
    async fn test_get_activity_score_for_activity_period() {
        let pool = db_manager::create_test_db().await;
        let activity_state_service = ActivityStateService::new(pool.clone());
        let activity_state_repo = ActivityStateRepo::new(pool.clone());

        let base_time = OffsetDateTime::now_utc()
            .replace_hour(10)
            .unwrap()
            .replace_minute(0)
            .unwrap()
            .replace_second(0)
            .unwrap()
            .replace_nanosecond(0)
            .unwrap();

        // Test case 1: All active states
        let activity_states_all_active = vec![
            ActivityState {
                id: Some(1),
                start_time: Some(base_time),
                end_time: Some(base_time + Duration::from_secs(2 * 60)),
                state: ActivityStateType::Active,
                app_switches: 0,
                created_at: Some(base_time),
            },
            ActivityState {
                id: Some(2),
                start_time: Some(base_time + Duration::from_secs(2 * 60)),
                end_time: Some(base_time + Duration::from_secs(4 * 60)),
                state: ActivityStateType::Active,
                app_switches: 0,
                created_at: Some(base_time),
            },
        ];

        for state in &activity_states_all_active {
            activity_state_repo
                .save_activity_state(state)
                .await
                .unwrap();
        }

        let activity_score = activity_state_service
            .get_activity_score_for_activity_states(&activity_states_all_active);
        assert_eq!(
            activity_score, 5.0,
            "Score should be 5 when all states are active"
        );
    }

    #[tokio::test]
    async fn test_get_app_switch_score_for_activity_states() {
        let pool = db_manager::create_test_db().await;
        let activity_state_service = ActivityStateService::new(pool.clone());
        let base_time = OffsetDateTime::now_utc();
        // Test case 1: Low app switches (should return 1.0)
        let low_switches = vec![
            ActivityState {
                id: Some(1),
                start_time: Some(base_time),
                end_time: Some(base_time),
                state: ActivityStateType::Active,
                app_switches: 2,
                created_at: Some(base_time),
            },
            ActivityState {
                id: Some(2),
                start_time: Some(base_time),
                end_time: Some(base_time),
                state: ActivityStateType::Active,
                app_switches: 1,
                created_at: Some(base_time),
            },
        ];
        assert_eq!(
            activity_state_service.get_app_switch_score_for_activity_states(&low_switches),
            1.0,
            "Score should be 1.0 for low app switches"
        );

        // Test case 2: Medium app switches (should return 0.5)
        let medium_switches = vec![
            ActivityState {
                id: Some(3),
                start_time: Some(base_time),
                end_time: Some(base_time),
                state: ActivityStateType::Active,
                app_switches: 6,
                created_at: Some(base_time),
            },
            ActivityState {
                id: Some(4),
                start_time: Some(base_time),
                end_time: Some(base_time),
                state: ActivityStateType::Active,
                app_switches: 7,
                created_at: Some(base_time),
            },
        ];
        assert_eq!(
            activity_state_service.get_app_switch_score_for_activity_states(&medium_switches),
            0.5,
            "Score should be 0.5 for medium app switches"
        );

        // Test case 3: High app switches (should return 0.0)
        let high_switches = vec![
            ActivityState {
                id: Some(5),
                start_time: Some(base_time),
                end_time: Some(base_time),
                state: ActivityStateType::Active,
                app_switches: 10,
                created_at: Some(base_time),
            },
            ActivityState {
                id: Some(6),
                start_time: Some(base_time),
                end_time: Some(base_time),
                state: ActivityStateType::Active,
                app_switches: 12,
                created_at: Some(base_time),
            },
        ];
        assert_eq!(
            activity_state_service.get_app_switch_score_for_activity_states(&high_switches),
            0.0,
            "Score should be 0.0 for high app switches"
        );
    }

    #[tokio::test]
    async fn test_get_flow_streak_score_for_activity_states() {
        let pool = db_manager::create_test_db().await;
        let activity_state_service = ActivityStateService::new(pool.clone());
        let base_time = OffsetDateTime::now_utc();

        // Test case 1: Score below threshold (should return 0)
        let low_score_period = ActivityFlowPeriod {
            id: None,
            start_time: Some(base_time),
            end_time: Some(base_time),
            score: 4.0,
            app_switches: 0,
            inactive_time: 0,
            created_at: base_time,
        };
        assert_eq!(
            activity_state_service.get_flow_streak_score_for_activity_states(&low_score_period),
            0.0,
            "Score should be 0 when previous flow period score is below 5"
        );

        // Test case 2: Score at threshold (should return 7)
        let threshold_score_period = ActivityFlowPeriod {
            id: None,
            start_time: Some(base_time),
            end_time: Some(base_time),
            score: 5.0,
            app_switches: 0,
            inactive_time: 0,
            created_at: base_time,
        };
        assert_eq!(
            activity_state_service
                .get_flow_streak_score_for_activity_states(&threshold_score_period),
            7.0,
            "Score should be 7 when previous flow period score is 5"
        );

        // Test case 3: Score that would exceed max (should return 10)
        let high_score_period = ActivityFlowPeriod {
            id: None,
            start_time: Some(base_time),
            end_time: Some(base_time),
            score: 9.0,
            app_switches: 0,
            inactive_time: 0,
            created_at: base_time,
        };
        assert_eq!(
            activity_state_service.get_flow_streak_score_for_activity_states(&high_score_period),
            10.0,
            "Score should be capped at 10 when previous flow period score + 2 would exceed 10"
        );
    }

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
