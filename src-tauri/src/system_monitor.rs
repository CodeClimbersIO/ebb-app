use monitor;
use tauri::async_runtime;
use tauri::AppHandle;
use tokio::time::{sleep, Duration};

pub fn start_monitoring(app: AppHandle) {
    async_runtime::spawn(async move {
        let callback = monitoring_service::get_callback().await;
        monitor::initialize_callback(callback).expect("Failed to initialize callback");

        loop {
            sleep(Duration::from_secs(1)).await;
            let _ = app.run_on_main_thread(move || {
                monitor::detect_changes().expect("Failed to detect changes");
            });
        }
    });
}
