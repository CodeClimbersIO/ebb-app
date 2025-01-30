use std::sync::Arc;

use monitoring_service::initialize_monitoring_service;
use os_monitor::detect_changes;
use os_monitor::initialize_monitor;
use os_monitor::Monitor;
use tauri::async_runtime;
use tauri::AppHandle;
use tokio::time::{sleep, Duration};

pub fn start_monitoring(app: AppHandle) {
    async_runtime::spawn(async move {
        let monitor = Arc::new(Monitor::new());
        initialize_monitor(monitor.clone()).expect("Failed to initialize monitor");
        initialize_monitoring_service(monitor.clone()).await;

        loop {
            sleep(Duration::from_secs(1)).await;
            let _ = app.run_on_main_thread(move || {
                detect_changes().expect("Failed to detect changes");
            });
        }
    });
}
