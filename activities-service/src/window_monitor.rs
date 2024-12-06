extern crate dotenv;
use dotenv::dotenv;
use monitor::{EventCallback, InputMonitor, KeyboardEvent, MouseEvent, WindowEvent};

use crate::{db::db_manager, ActivityService};

struct WindowEventCallback {
    activity_service: ActivityService,
}

impl EventCallback for WindowEventCallback {
    fn on_mouse_event(&self, event: MouseEvent) {
        println!("mouse event: {:?}", event);
        let service = self.activity_service.clone();
        tokio::spawn(async move { service.on_mouse_event(event).await });
    }

    fn on_keyboard_event(&self, event: KeyboardEvent) {
        println!("keyboard event: {:?}", event);
        let service = self.activity_service.clone();
        tokio::spawn(async move { service.on_keyboard_event(event).await });
    }

    fn on_window_event(&self, event: WindowEvent) {
        println!("window event: {:?}", event);
        let service = self.activity_service.clone();
        tokio::spawn(async move { service.on_window_event(event).await });
    }
}

#[tokio::main]
pub async fn start_monitoring() {
    dotenv().ok();
    let db_path = db_manager::get_db_path();
    let db_manager = db_manager::DbManager::new(&db_path).await.unwrap();
    let result: Result<i32, _> = sqlx::query_scalar("SELECT 1")
        .fetch_one(&db_manager.pool)
        .await;

    let activity_service = ActivityService::new(db_manager.pool);

    let callback = WindowEventCallback { activity_service };
    let monitor = InputMonitor::new(callback);
    if let Err(e) = monitor.start() {
        eprintln!("Failed to start monitor: {}", e);
    };
}
