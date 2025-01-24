use std::{sync::Arc, time::Duration};

use monitor::{Monitor, WindowEvent};
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use tokio::sync::mpsc;

use crate::db::{
    activity_repo::ActivityRepo, activity_state_repo::ActivityStateRepo, db_manager,
    models::Activity,
};

use self::activity_state_service::ActivityPeriod;

use super::{
    activity_state_service::{self, ActivityStateService},
    app_switch_service::AppSwitchState,
};

#[cfg(test)]
use crate::db::models::ActivityState;
#[cfg(test)]
use time::OffsetDateTime;

static APP_SWITCH_STATE: Lazy<Mutex<AppSwitchState>> =
    Lazy::new(|| Mutex::new(AppSwitchState::new(Duration::from_secs(2))));

#[derive(Clone)]
pub struct ActivityService {
    activities_repo: ActivityRepo,
    activity_state_repo: ActivityStateRepo,
    event_sender: mpsc::UnboundedSender<ActivityEvent>,
    activity_state_service: ActivityStateService,
}

enum ActivityEvent {
    Keyboard(),
    Mouse(),
    Window(WindowEvent),
}

impl ActivityService {
    pub fn new(pool: sqlx::SqlitePool) -> Self {
        let (sender, mut receiver) = mpsc::unbounded_channel();
        let activities_repo = ActivityRepo::new(pool.clone());
        let activity_state_repo = ActivityStateRepo::new(pool.clone());
        let activity_state_service = ActivityStateService::new(pool.clone());

        let service = ActivityService {
            activities_repo,
            activity_state_repo,
            activity_state_service,
            event_sender: sender,
        };
        let callback_service_clone = service.clone();
        // let activity_state_clone = service.clone();

        tokio::spawn(async move {
            while let Some(event) = receiver.recv().await {
                match event {
                    ActivityEvent::Keyboard() => {
                        callback_service_clone.handle_keyboard_activity().await
                    }
                    ActivityEvent::Mouse() => callback_service_clone.handle_mouse_activity().await,
                    ActivityEvent::Window(e) => {
                        callback_service_clone.handle_window_activity(e).await
                    }
                }
            }
        });

        service
    }

    async fn handle_keyboard_activity(&self) {
        let activity = Activity::create_keyboard_activity();
        if let Err(err) = self.save_activity(&activity).await {
            eprintln!("Failed to save keyboard activity: {}", err);
        }
    }

    async fn handle_mouse_activity(&self) {
        let activity = Activity::create_mouse_activity();
        if let Err(err) = self.save_activity(&activity).await {
            eprintln!("Failed to save mouse activity: {}", err);
        }
    }

    async fn handle_window_activity(&self, event: WindowEvent) {
        let activity = Activity::create_window_activity(&event);
        if let Err(err) = self.save_activity(&activity).await {
            eprintln!("Failed to save window activity: {}", err);
        }
    }

    pub fn register_callbacks(&self, event_callback_service: &Arc<Monitor>) {
        let sender = self.event_sender.clone();
        event_callback_service.register_keyboard_callback(Box::new(move |_| {
            let _ = sender.send(ActivityEvent::Keyboard());
        }));

        let sender = self.event_sender.clone();
        event_callback_service.register_mouse_callback(Box::new(move |_| {
            let _ = sender.send(ActivityEvent::Mouse());
        }));

        let sender = self.event_sender.clone();
        event_callback_service.register_window_callback(Box::new(move |event| {
            let mut app_switch_state = APP_SWITCH_STATE.lock();
            let activity = Activity::create_window_activity(&event);
            app_switch_state.new_window_activity(activity);
            let _ = sender.send(ActivityEvent::Window(event));
        }));
    }

    pub async fn save_activity(
        &self,
        activity: &Activity,
    ) -> Result<sqlx::sqlite::SqliteQueryResult, sqlx::Error> {
        self.activities_repo.save_activity(activity).await
    }

    #[cfg(test)]
    pub async fn get_activity(&self, id: i32) -> Result<Activity, sqlx::Error> {
        self.activities_repo.get_activity(id).await
    }

    #[cfg(test)]
    async fn save_activity_state(
        &self,
        activity_state: &ActivityState,
    ) -> Result<sqlx::sqlite::SqliteQueryResult, sqlx::Error> {
        self.activity_state_repo
            .save_activity_state(activity_state)
            .await
    }

    async fn get_activities_since_last_activity_state(&self) -> Result<Vec<Activity>, sqlx::Error> {
        self.activities_repo
            .get_activities_since_last_activity_state()
            .await
    }

    async fn create_activity_state_from_activities(
        &self,
        activities: Vec<Activity>,
        activity_period: ActivityPeriod,
    ) -> Result<sqlx::sqlite::SqliteQueryResult, sqlx::Error> {
        // iterate over the activities to create the start, end, context_switches, and activity_state_type
        println!(
            "\n\ncreate_activity_state_from_activities: {:?}",
            activities
        );
        println!(
            "create_activity_state_from_activities: {}",
            activities.len()
        );

        if activities.is_empty() {
            println!("create_activity_state_from_activities: empty");
            self.activity_state_repo
                .create_idle_activity_state(&activity_period)
                .await
        } else {
            println!("create_activity_state_from_activities: not empty");
            // First lock: Get the context switches
            let context_switches = {
                let app_switch = APP_SWITCH_STATE.lock();
                app_switch.app_switches.clone()
            }; // lock is released here
            let result = self
                .activity_state_repo
                .create_active_activity_state(context_switches, &activity_period)
                .await;

            {
                let mut app_switch = APP_SWITCH_STATE.lock();
                app_switch.reset_app_switches();
            } // lock is released here
            result
        }
    }

    #[cfg(test)]
    async fn get_last_activity_state(&self) -> Result<ActivityState, sqlx::Error> {
        self.activity_state_repo.get_last_activity_state().await
    }

    #[cfg(test)]
    async fn get_activity_starting_states_between(
        &self,
        start_time: OffsetDateTime,
        end_time: OffsetDateTime,
    ) -> Result<Vec<ActivityState>, sqlx::Error> {
        self.activity_state_repo
            .get_activity_states_starting_between(start_time, end_time)
            .await
    }

    pub fn start_activity_state_loop(&self, activity_state_interval: Duration) {
        let activity_service_clone = self.clone();
        let activity_state_service_clone = self.activity_state_service.clone();
        tokio::spawn(async move {
            let mut wait_interval = tokio::time::interval(activity_state_interval);
            loop {
                println!("tick");
                wait_interval.tick().await;
                let activities = activity_service_clone
                    .get_activities_since_last_activity_state()
                    .await
                    .unwrap();
                let activity_period = activity_state_service_clone
                    .get_next_activity_state_times(activity_state_interval)
                    .await;
                activity_service_clone
                    .create_activity_state_from_activities(activities, activity_period)
                    .await
                    .expect("Failed to create activity state");

                println!("activity_state_created\n");
            }
        });
    }
}

pub async fn start_monitoring() -> ActivityService {
    let db_path = db_manager::get_db_path();
    let db_manager = db_manager::DbManager::new(&db_path).await.unwrap();

    ActivityService::new(db_manager.pool)
}

#[cfg(test)]
mod tests {

    use monitor::WindowEvent;
    use time::OffsetDateTime;

    use super::*;
    use crate::db::{
        db_manager,
        models::{ActivityStateType, ActivityType},
    };

    #[tokio::test]
    async fn test_activity_service() {
        let pool = db_manager::create_test_db().await;
        let activity_service = ActivityService::new(pool);
        let activity = Activity::__create_test_window();

        activity_service.save_activity(&activity).await.unwrap();
    }

    #[tokio::test]
    async fn test_get_activity() {
        let pool = db_manager::create_test_db().await;
        let activity_service = ActivityService::new(pool);
        let activity = Activity::__create_test_window();
        activity_service.save_activity(&activity).await.unwrap();

        let activity = activity_service.get_activity(1).await.unwrap();
        assert_eq!(
            activity.app_window_title,
            Some("main.rs - app-codeclimbers".to_string())
        );
    }

    #[tokio::test]
    async fn test_on_window_event() {
        let pool = db_manager::create_test_db().await;
        let activity_service = ActivityService::new(pool);
        let event = WindowEvent {
            app_name: "Cursor".to_string(),
            window_title: "main.rs - app-codeclimbers".to_string(),
            url: None,
        };
        activity_service.handle_window_activity(event).await;

        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        let activity = activity_service.get_activity(1).await.unwrap();
        assert_eq!(activity.app_name, Some("Cursor".to_string()));
    }

    #[tokio::test]
    async fn test_on_keyboard_event() {
        let pool = db_manager::create_test_db().await;
        let activity_service = ActivityService::new(pool);
        activity_service.handle_keyboard_activity().await;

        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        let activity = activity_service.get_activity(1).await.unwrap();
        assert_eq!(activity.activity_type, ActivityType::Keyboard);
    }

    #[tokio::test]
    async fn test_create_activity_state_from_activities_inactive() {
        let pool = db_manager::create_test_db().await;
        let activity_service = ActivityService::new(pool);
        let activities = vec![];
        let result = activity_service
            .create_activity_state_from_activities(
                activities,
                ActivityPeriod {
                    start_time: OffsetDateTime::now_utc(),
                    end_time: OffsetDateTime::now_utc() + Duration::from_secs(120),
                },
            )
            .await;
        assert!(result.is_ok());
        let activity_state = activity_service.get_last_activity_state().await.unwrap();
        assert_eq!(activity_state.state, ActivityStateType::Inactive);
        assert_eq!(activity_state.app_switches, 0);
    }

    #[tokio::test]
    async fn test_create_activity_state_from_activities_active() {
        let pool = db_manager::create_test_db().await;
        let activity_service = ActivityService::new(pool);
        let activities = vec![Activity::__create_test_window()];
        let result = activity_service
            .create_activity_state_from_activities(
                activities,
                ActivityPeriod {
                    start_time: OffsetDateTime::now_utc(),
                    end_time: OffsetDateTime::now_utc() + Duration::from_secs(120),
                },
            )
            .await;
        assert!(result.is_ok());
        let activity_state = activity_service.get_last_activity_state().await.unwrap();
        assert_eq!(activity_state.state, ActivityStateType::Active);
        assert_eq!(activity_state.app_switches, 0);
    }

    #[tokio::test]
    async fn test_get_activities_since_last_activity_state_edge_time_case() {
        let pool = db_manager::create_test_db().await;
        let activity_service = ActivityService::new(pool);
        let now = OffsetDateTime::now_utc();

        // we have an activity at time 2 seconds ago.
        let mut activity = Activity::__create_test_window();
        activity.timestamp = Some(now - Duration::from_secs(2));
        activity_service.save_activity(&activity).await.unwrap();

        // we have an activity at time 1 second ago.
        let mut activity = Activity::__create_test_window();
        activity.timestamp = Some(now - Duration::from_secs(1));
        activity_service.save_activity(&activity).await.unwrap();

        // we have an activity at time 0 seconds ago.
        let mut activity = Activity::__create_test_window();
        activity.timestamp = Some(now);
        activity_service.save_activity(&activity).await.unwrap();

        // we have an activity_state that started 1 second ago.
        let mut activity_state = ActivityState::new();
        activity_state.start_time = Some(now - Duration::from_secs(1));
        activity_service
            .save_activity_state(&activity_state)
            .await
            .unwrap();

        // retrieve activities since the last activity state
        let activities = activity_service
            .get_activities_since_last_activity_state()
            .await
            .unwrap();
        // should equal to 1 as the first activity is at time 2 seconds ago and the second activity is at time 1 second ago.
        assert_eq!(activities.len(), 1);

        // assert that the activities are from the second time window
    }

    #[tokio::test]
    async fn test_activity_state_loop() {
        let pool = db_manager::create_test_db().await;
        let activity_service = ActivityService::new(pool);
        let start = OffsetDateTime::now_utc();

        activity_service.start_activity_state_loop(Duration::from_millis(100));

        // Wait for a few iterations
        tokio::time::sleep(Duration::from_millis(350)).await;

        // Verify the results
        let activity_states = activity_service
            .get_activity_starting_states_between(start, OffsetDateTime::now_utc())
            .await
            .unwrap();

        assert_eq!(activity_states.len(), 3);
    }
}
