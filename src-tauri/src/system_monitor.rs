use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use os_monitor::{detect_changes, has_accessibility_permissions, BlockedAppEvent, Monitor};
use os_monitor_service::initialize_monitoring_service;

use tauri::{async_runtime, Emitter};
use tokio::time::{sleep, Duration};

// Static flag to track if monitoring is already running
static MONITOR_RUNNING: AtomicBool = AtomicBool::new(false);

pub fn is_monitoring_running() -> bool {
    MONITOR_RUNNING.load(Ordering::SeqCst)
}

pub fn get_default_db_path() -> String {
    let home_dir = dirs::home_dir().expect("Could not find home directory");
    home_dir
        .join(".codeclimbers")
        .join("codeclimbers-desktop.sqlite")
        .to_str()
        .expect("Invalid path")
        .to_string()
}
fn on_app_blocked(app_handle: tauri::AppHandle, event: BlockedAppEvent) {
    log::warn!("Apps blocked:");
    for app in &event.blocked_apps {
        log::warn!("  - {} ({})", app.app_name, app.app_external_id);
    }

    app_handle
        .emit("on-app-blocked", event)
        .unwrap_or_else(|e| {
            log::error!("Failed to emit on-app-blocked event: {}", e);
        });
}

pub fn start_monitoring(app_handle: tauri::AppHandle) {
    log::info!("Starting monitoring service...");
    // Check if monitoring is already running
    if MONITOR_RUNNING
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        log::info!("Monitoring service is already running, skipping...");
        return;
    }

    log::info!("Starting monitoring service...");

    async_runtime::spawn(async move {
        log::info!("Initializing monitor in async runtime...");
        let db_path = get_default_db_path();
        let monitor = Arc::new(Monitor::new());
        let app_handle_clone = app_handle.clone();
        monitor.register_app_blocked_callback(Box::new(move |event| {
            on_app_blocked(app_handle_clone.clone(), event);
        }));
        initialize_monitoring_service(monitor.clone(), db_path).await;
        log::info!("Monitor initialized");

        loop {
            log::trace!("Monitor loop iteration starting");
            if let Err(e) = detect_changes() {
                log::error!("Failed to detect changes: {}", e);
                // On error, allow restarting the monitoring service
                MONITOR_RUNNING.store(false, Ordering::SeqCst);
                break;
            }

            sleep(Duration::from_secs(1)).await;
            if !has_accessibility_permissions() {
                log::error!("Accessibility permissions not granted, stopping monitoring");
                MONITOR_RUNNING.store(false, Ordering::SeqCst);
                break;
            }
            log::trace!("Monitor loop iteration completed");
        }
    });
}
