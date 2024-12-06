// activity service provides an interface to read/write to the activities table

use monitor::{KeyboardEvent, MouseEvent, WindowEvent};

use crate::db::{activities_repo::ActivitiesRepo, models::Activity};
#[derive(Clone)]
pub struct ActivityService {
    activities_repo: ActivitiesRepo,
}

impl ActivityService {
    pub fn new(pool: sqlx::SqlitePool) -> Self {
        ActivityService {
            activities_repo: ActivitiesRepo::new(pool),
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

    pub async fn on_keyboard_event(&self, event: KeyboardEvent) {
        println!("on_keyboard_event: {:?}", event);
        let activity = Activity::create_keyboard_activity(&event);
        self.activities_repo
            .save_activity(&activity)
            .await
            .expect("failed to save activity");
    }

    pub async fn on_mouse_event(&self, event: MouseEvent) {
        println!("on_mouse_event: {:?}", event);
        let activity = Activity::create_mouse_activity(&event);
        self.activities_repo
            .save_activity(&activity)
            .await
            .expect("failed to save activity");
    }

    pub async fn on_window_event(&self, event: WindowEvent) {
        println!("on_window_event: {:?}", event);
        let activity = Activity::create_window_activity(&event);
        self.activities_repo
            .save_activity(&activity)
            .await
            .expect("failed to save activity");
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
        activity_service.on_window_event(event).await;

        let activity = activity_service.get_activity(1).await.unwrap();
        assert_eq!(activity.app_name, Some("Cursor".to_string()));
    }
}
