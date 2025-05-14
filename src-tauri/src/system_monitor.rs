use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use os_monitor::{
    detect_changes, has_accessibility_permissions, AppEvent, BlockedAppEvent, Monitor,
};
use os_monitor_service::initialize_monitoring_service;

use tauri::{async_runtime, AppHandle, Emitter};
use tokio::time::{sleep, Duration};

// Static flag to track if monitoring is already running
static MONITOR_RUNNING: AtomicBool = AtomicBool::new(false);
static MONITOR_APP_HANDLE: Mutex<Option<AppHandle>> = Mutex::new(None);

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

pub fn start_monitoring(app_handle: AppHandle) {
    log::info!("Starting monitoring service...");
    *MONITOR_APP_HANDLE.lock().unwrap() = Some(app_handle.clone());
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

        let monitor = Monitor::new();
        let mut app_receiver = monitor.subscribe();
        let register_blocked_handle_clone = app_handle.clone();

        // Initialize monitoring service first
        initialize_monitoring_service(Arc::new(monitor), db_path).await;
        log::info!("Monitor initialized");

        std::thread::spawn(move || {
            println!("Event listener thread started");
            while let Ok(event) = app_receiver.blocking_recv() {
                match event {
                    AppEvent::AppBlocked(event) => {
                        on_app_blocked(register_blocked_handle_clone.clone(), event);
                    }
                    AppEvent::Window(_) => {}
                    AppEvent::Mouse(_) => {}
                    AppEvent::Keyboard(_) => {}
                }
            }
            log::warn!("Event receiver channel closed");
        });

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
