use tauri::async_runtime;
use tauri::AppHandle;
use tokio::time::{sleep, Duration};

pub fn start_monitoring(app: AppHandle) {
    async_runtime::spawn(async move {
        monitoring_service::initialize_monitor().await;

        loop {
            sleep(Duration::from_secs(1)).await;
            let _ = app.run_on_main_thread(move || {
                monitoring_service::detect_changes().expect("Failed to detect changes");
            });
        }
    });
}
