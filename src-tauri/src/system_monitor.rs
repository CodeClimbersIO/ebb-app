use std::sync::Arc;

use activities_service;
use monitor;
use tauri::async_runtime;
use tauri::AppHandle;
use tokio::time::{sleep, Duration};

pub fn start_monitoring(app: AppHandle) {
    async_runtime::spawn(async move {
        let activity_service = Arc::new(activities_service::start_monitoring().await);
        monitor::initialize_callback(activity_service.clone())
            .expect("Failed to initialize callback");
        loop {
            sleep(Duration::from_secs(1)).await;
            let _ = app.run_on_main_thread(move || {
                monitor::detect_changes().expect("Failed to detect changes");
            });
        }
    });
}
