use std::sync::Arc;

use os_monitor::{
    detect_changes, has_accessibility_permissions, request_accessibility_permissions, Monitor,
};
use os_monitor_service::initialize_monitoring_service;

use tauri::async_runtime;
use tokio::time::{sleep, Duration};

pub fn get_default_db_path() -> String {
    let home_dir = dirs::home_dir().expect("Could not find home directory");
    home_dir
        .join(".codeclimbers")
        .join("codeclimbers-desktop.sqlite")
        .to_str()
        .expect("Invalid path")
        .to_string()
}

pub fn start_monitoring() {
    log::info!("Starting monitoring service...");

    // Start heartbeat monitoring in a separate task
    let has_permissions = has_accessibility_permissions();
    println!("has_permissions: {}", has_permissions);
    if !has_permissions {
        let request_permissions = request_accessibility_permissions();
        println!("request_permissions: {}", request_permissions);
    }

    async_runtime::spawn(async move {
        log::info!("Initializing monitor in async runtime...");
        let db_path = get_default_db_path();
        let monitor = Arc::new(Monitor::new());
        initialize_monitoring_service(monitor.clone(), db_path).await;
        log::info!("Monitor initialized");

        loop {
            log::info!("Monitor loop iteration starting");
            detect_changes().expect("Failed to detect changes");
            sleep(Duration::from_secs(1)).await;

            log::info!("Monitor loop iteration completed");
        }
    });
}
