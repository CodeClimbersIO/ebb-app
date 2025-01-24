use monitor::detect_changes;
use monitoring_service::initialize_monitor;
use tauri::async_runtime;
use tauri::AppHandle;
use tokio::time::{sleep, Duration};

pub fn start_monitoring(app: AppHandle) {
    async_runtime::spawn(async move {
        initialize_monitor().await;
        loop {
            sleep(Duration::from_secs(1)).await;
            let _ = app.run_on_main_thread(move || {
                detect_changes().expect("Failed to detect changes");
            });
        }
    });
}
