use std::time::Duration;

use monitor::{EventCallback, KeyboardEvent, MouseEvent, WindowEvent};
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use time::OffsetDateTime;
use tokio::sync::mpsc;

use crate::db::{
    activity_repo::ActivityRepo,
    activity_state_repo::ActivityStateRepo,
    db_manager,
    models::{Activity, ActivityState},
};

use super::context_switch::ContextSwitchState;

static CONTEXT_SWITCH_STATE: Lazy<Mutex<ContextSwitchState>> =
    Lazy::new(|| Mutex::new(ContextSwitchState::new(Duration::from_secs(2))));

#[derive(Clone)]
pub struct ActivityService {
    activities_repo: ActivityRepo,
    activity_state_repo: ActivityStateRepo,
    event_sender: mpsc::UnboundedSender<ActivityEvent>,
}

enum ActivityEvent {
    Keyboard(),
    Mouse(),
    Window(WindowEvent),
}

impl EventCallback for ActivityService {
    fn on_keyboard_events(&self, events: Vec<KeyboardEvent>) {
        if events.is_empty() {
            return;
        }
        if let Err(e) = self.event_sender.send(ActivityEvent::Keyboard()) {
            eprintln!("Failed to send keyboard event: {}", e);
        }
    }

    fn on_mouse_events(&self, events: Vec<MouseEvent>) {
        if events.is_empty() {
            return;
        }
        if let Err(e) = self.event_sender.send(ActivityEvent::Mouse()) {
            eprintln!("Failed to send mouse event: {}", e);
        }
    }

    fn on_window_event(&self, event: WindowEvent) {
        println!("on_window_event: {:?}", event);
        let mut context_switch_state = CONTEXT_SWITCH_STATE.lock();
        let activity = Activity::create_window_activity(&event);
        context_switch_state.new_window_activity(activity);
        println!(
            "context_switches: {}",
            context_switch_state.context_switches
        );
        if let Err(e) = self.event_sender.send(ActivityEvent::Window(event)) {
            eprintln!("Failed to send window event: {}", e);
        }
    }
}
impl ActivityService {
    async fn handle_keyboard_activity(&self) {
        let activity = Activity::create_keyboard_activity();
        if let Err(err) = self.save_activity(&activity).await {
            eprintln!("Failed to save keyboard activity: {}", err);
        }
    }

    async fn handle_mouse_activity(&self) {
        println!("handle_mouse_activity");
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

    pub fn new(pool: sqlx::SqlitePool) -> Self {
        let (sender, mut receiver) = mpsc::unbounded_channel();
        let activities_repo = ActivityRepo::new(pool.clone());
        let activity_state_repo = ActivityStateRepo::new(pool.clone());
        let service = ActivityService {
            activities_repo,
            activity_state_repo,
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

    pub async fn save_activity(
        &self,
        activity: &Activity,
    ) -> Result<sqlx::sqlite::SqliteQueryResult, sqlx::Error> {
        self.activities_repo.save_activity(activity).await
    }

    pub async fn get_activity(&self, id: i32) -> Result<Activity, sqlx::Error> {
        self.activities_repo.get_activity(id).await
    }

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
        interval: Duration,
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
                .create_idle_activity_state(interval)
                .await
        } else {
            println!("create_activity_state_from_activities: not empty");
            // First lock: Get the context switches
            let context_switches = {
                let context_switch = CONTEXT_SWITCH_STATE.lock();
                context_switch.context_switches.clone()
            }; // lock is released here
            let result = self
                .activity_state_repo
                .create_active_activity_state(context_switches, interval)
                .await;

            {
                let mut context_switch = CONTEXT_SWITCH_STATE.lock();
                context_switch.reset_context_switches();
            } // lock is released here
            result
        }
    }

    async fn get_last_activity_state(&self) -> Result<ActivityState, sqlx::Error> {
        self.activity_state_repo.get_last_activity_state().await
    }

    async fn get_activity_starting_states_between(
        &self,
        start_time: OffsetDateTime,
        end_time: OffsetDateTime,
    ) -> Result<Vec<ActivityState>, sqlx::Error> {
        self.activity_state_repo
            .get_activity_states_starting_between(start_time, end_time)
            .await
    }

    async fn get_all_activity_states(&self) -> Result<Vec<ActivityState>, sqlx::Error> {
        self.activity_state_repo.get_all_activity_states().await
    }

    pub fn start_activity_state_loop(&self, activity_state_interval: Duration) {
        let activity_service_clone = self.clone();
        tokio::spawn(async move {
            let mut wait_interval = tokio::time::interval(activity_state_interval);
            loop {
                println!("tick");
                wait_interval.tick().await;
                let activities = activity_service_clone
                    .get_activities_since_last_activity_state()
                    .await
                    .unwrap();

                activity_service_clone
                    .create_activity_state_from_activities(activities, activity_state_interval)
                    .await
                    .expect("Failed to create activity state");

                println!("activity_state_created\n");
            }
        });
    }
}

pub async fn start_monitoring() -> ActivityService {
    println!("monitoring starting");

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
            title: "main.rs - app-codeclimbers".to_string(),
        };
        activity_service.on_window_event(event);

        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        let activity = activity_service.get_activity(1).await.unwrap();
        assert_eq!(activity.app_name, Some("Cursor".to_string()));
    }

    #[tokio::test]
    async fn test_on_keyboard_event() {
        let pool = db_manager::create_test_db().await;
        let activity_service = ActivityService::new(pool);
        let event = KeyboardEvent { key_code: 65 };
        activity_service.on_keyboard_events(vec![event]);

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
            .create_activity_state_from_activities(activities, Duration::from_secs(120))
            .await;
        assert!(result.is_ok());
        let activity_state = activity_service.get_last_activity_state().await.unwrap();
        assert_eq!(activity_state.state, ActivityStateType::Inactive);
        assert_eq!(activity_state.context_switches, 0);
    }

    #[tokio::test]
    async fn test_create_activity_state_from_activities_active() {
        let pool = db_manager::create_test_db().await;
        let activity_service = ActivityService::new(pool);
        let activities = vec![Activity::__create_test_window()];
        let result = activity_service
            .create_activity_state_from_activities(activities, Duration::from_secs(120))
            .await;
        assert!(result.is_ok());
        let activity_state = activity_service.get_last_activity_state().await.unwrap();
        assert_eq!(activity_state.state, ActivityStateType::Active);
        assert_eq!(activity_state.context_switches, 0);
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

        assert!(activity_states.len() >= 3);
    }
}
