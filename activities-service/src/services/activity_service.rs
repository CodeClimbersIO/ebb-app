use std::time::Duration;

// activity service provides an interface to read/write to the activities table
use monitor::{EventCallback, KeyboardEvent, MouseEvent, WindowEvent};
use parking_lot::Mutex;
use tokio::{sync::mpsc, time::Instant};

use crate::db::{activities_repo::ActivitiesRepo, models::Activity};
#[derive(Clone)]
pub struct ActivityService {
    activities_repo: ActivitiesRepo,
    event_sender: mpsc::UnboundedSender<ActivityEvent>,
    last_keyboard_time: std::sync::Arc<Mutex<Instant>>,
    last_mouse_time: std::sync::Arc<Mutex<Instant>>,
}

enum ActivityEvent {
    Keyboard(KeyboardEvent),
    Mouse(MouseEvent),
    Window(WindowEvent),
}

impl EventCallback for ActivityService {
    fn on_keyboard_event(&self, event: KeyboardEvent) {
        println!("on_keyboard_event: {:?}", event);
        if let Err(e) = self.event_sender.send(ActivityEvent::Keyboard(event)) {
            eprintln!("Failed to send keyboard event: {}", e);
        }
    }

    fn on_mouse_event(&self, event: MouseEvent) {
        println!("on_mouse_event: {:?}", event);
        if let Err(e) = self.event_sender.send(ActivityEvent::Mouse(event)) {
            eprintln!("Failed to send mouse event: {}", e);
        }
    }

    fn on_window_event(&self, event: WindowEvent) {
        println!("on_window_event: {:?}", event);
        if let Err(e) = self.event_sender.send(ActivityEvent::Window(event)) {
            eprintln!("Failed to send window event: {}", e);
        }
    }
}
impl ActivityService {
    fn should_save_event(now: Instant, last_time: &std::sync::Arc<Mutex<Instant>>) -> bool {
        let mut guard = last_time.lock();
        println!("now: {:?}", now);
        println!("last_time: {:?}", *guard);
        println!("duration: {:?}", now.duration_since(*guard));
        println!("duration 30: {:?}", Duration::from_secs(30));
        println!(
            "duration >= 30: {:?}",
            now.duration_since(*guard) >= Duration::from_secs(30)
        );
        if now.duration_since(*guard) >= Duration::from_secs(30) {
            println!("saving event");
            *guard = now;
            true
        } else {
            println!("not saving event");
            false
        }
    }

    async fn handle_keyboard_activity(&self, event: KeyboardEvent) {
        if Self::should_save_event(Instant::now(), &self.last_keyboard_time) {
            let activity = Activity::create_keyboard_activity(&event);
            if let Err(err) = self.save_activity(&activity).await {
                eprintln!("Failed to save keyboard activity: {}", err);
            }
        }
    }

    async fn handle_mouse_activity(&self, event: MouseEvent) {
        if Self::should_save_event(Instant::now(), &self.last_mouse_time) {
            let activity = Activity::create_mouse_activity(&event);
            if let Err(err) = self.save_activity(&activity).await {
                eprintln!("Failed to save mouse activity: {}", err);
            }
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
        let activities_repo = ActivitiesRepo::new(pool);
        let past = Instant::now() - Duration::from_millis(30_100); // 30.1 seconds ago
        let service = ActivityService {
            activities_repo,
            event_sender: sender,
            last_keyboard_time: std::sync::Arc::new(parking_lot::Mutex::new(past)),
            last_mouse_time: std::sync::Arc::new(parking_lot::Mutex::new(past)),
        };
        let service_clone = service.clone();

        tokio::spawn(async move {
            while let Some(event) = receiver.recv().await {
                match event {
                    ActivityEvent::Keyboard(e) => {
                        Self::handle_keyboard_activity(&service_clone, e).await
                    }
                    ActivityEvent::Mouse(e) => Self::handle_mouse_activity(&service_clone, e).await,
                    ActivityEvent::Window(e) => {
                        Self::handle_window_activity(&service_clone, e).await
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
}

#[cfg(test)]
mod tests {
    use std::time::Duration;
    use tokio::time::Instant;

    use monitor::{KeyboardEvent, MouseEventType, WindowEvent};

    use super::*;
    use crate::db::{db_manager, models::ActivityType};

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
        activity_service.on_keyboard_event(event);

        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        let activity = activity_service.get_activity(1).await.unwrap();
        assert_eq!(activity.activity_type, ActivityType::Keyboard);
    }

    #[tokio::test]
    async fn test_on_mouse_event() {
        let pool = db_manager::create_test_db().await;
        let activity_service = ActivityService::new(pool);
        let event = MouseEvent {
            x: 127.32,
            y: 300.81,
            event_type: MouseEventType::Move,
            scroll_delta: 0,
        };
        activity_service.on_mouse_event(event);

        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        let activity = activity_service.get_activity(1).await.unwrap();
        assert_eq!(activity.mouse_x, Some(127.32));
    }

    #[tokio::test]
    async fn test_on_mouse_event_should_save() {
        let pool = db_manager::create_test_db().await;
        let activity_service = ActivityService::new(pool);
        let event = MouseEvent {
            x: 127.32,
            y: 300.81,
            event_type: MouseEventType::Move,
            scroll_delta: 0,
        };
        activity_service.on_mouse_event(event);
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        let event = MouseEvent {
            x: 127.32,
            y: 300.81,
            event_type: MouseEventType::Move,
            scroll_delta: 0,
        };
        activity_service.on_mouse_event(event);
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        let result = activity_service.get_activity(2).await;
        assert!(result.is_err());

        // the second event should not be saved because it's within the 30 second threshold
        match result {
            Err(sqlx::Error::RowNotFound) => (),
            _ => panic!("Expected RowNotFound error"),
        }
    }
    #[test]
    fn test_should_save_event() {
        let now = Instant::now();
        let last_time = std::sync::Arc::new(Mutex::new(now));

        // Create an instant that's 31 seconds in the future
        let future = now + Duration::from_secs(31);
        assert!(ActivityService::should_save_event(future, &last_time));
        // Call immediately after the 31-second future call should not save
        assert!(!ActivityService::should_save_event(future, &last_time));
    }

    #[test]
    fn test_should_save_event_exact_threshold() {
        let last_time = std::sync::Arc::new(Mutex::new(Instant::now()));

        // Exactly 30 seconds should save
        let future = Instant::now() + Duration::from_secs(30);
        assert!(ActivityService::should_save_event(future, &last_time));

        // Exactly 29.9 seconds should not save
        let just_under = Instant::now() + Duration::from_secs(30) - Duration::from_millis(100);
        assert!(!ActivityService::should_save_event(just_under, &last_time));
    }
}
