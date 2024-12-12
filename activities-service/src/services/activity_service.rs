// activity service provides an interface to read/write to the activities table
use monitor::{EventCallback, KeyboardEvent, MouseEvent, WindowEvent};
use tokio::sync::mpsc;

use crate::db::{activities_repo::ActivitiesRepo, models::Activity};
#[derive(Clone)]
pub struct ActivityService {
    activities_repo: ActivitiesRepo,
    event_sender: mpsc::UnboundedSender<ActivityEvent>,
}

enum ActivityEvent {
    Keyboard(KeyboardEvent),
    Mouse(MouseEvent),
    Window(WindowEvent),
}

impl EventCallback for ActivityService {
    fn on_keyboard_event(&self, event: KeyboardEvent) {
        if let Err(e) = self.event_sender.send(ActivityEvent::Keyboard(event)) {
            eprintln!("Failed to send keyboard event: {}", e);
        }
    }

    fn on_mouse_event(&self, event: MouseEvent) {
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
    pub fn new(pool: sqlx::SqlitePool) -> Self {
        let (sender, mut receiver) = mpsc::unbounded_channel();

        let activities_repo = ActivitiesRepo::new(pool);
        let repo = activities_repo.clone();
        tokio::spawn(async move {
            while let Some(event) = receiver.recv().await {
                match event {
                    ActivityEvent::Keyboard(e) => {
                        let activity = Activity::create_keyboard_activity(&e);
                        if let Err(err) = repo.save_activity(&activity).await {
                            eprintln!("Failed to save keyboard activity: {}", err);
                        }
                    }
                    ActivityEvent::Mouse(e) => {
                        let activity = Activity::create_mouse_activity(&e);
                        if let Err(err) = repo.save_activity(&activity).await {
                            eprintln!("Failed to save mouse activity: {}", err);
                        }
                    }
                    ActivityEvent::Window(e) => {
                        let activity = Activity::create_window_activity(&e);
                        println!("activity: {:?}", activity.app_window_title);
                        if let Err(err) = repo.save_activity(&activity).await {
                            eprintln!("Failed to save window activity: {}", err);
                        }
                    }
                }
            }
        });
        ActivityService {
            activities_repo,
            event_sender: sender,
        }
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
    use super::*;
    use crate::db::db_manager;

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

        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

        let activity = activity_service.get_activity(1).await.unwrap();
        assert_eq!(activity.app_name, Some("Cursor".to_string()));
    }
}
