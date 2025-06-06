use ebb_db::{db_manager, services::device_service::DeviceService};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use os_monitor::{
    detect_changes, has_accessibility_permissions, AppEvent, BlockedAppEvent, Monitor,
};
use os_monitor_service::MonitoringConfig;

use tauri::{async_runtime, AppHandle, Emitter};
use tokio::time::{sleep, Duration};

// Static flag to track if monitoring is already running
static MONITOR_RUNNING: AtomicBool = AtomicBool::new(false);
static MONITOR_APP_HANDLE: Mutex<Option<AppHandle>> = Mutex::new(None);

pub fn is_monitoring_running() -> bool {
    MONITOR_RUNNING.load(Ordering::SeqCst)
}

async fn get_idle_sensitivity() -> Result<i32, Box<dyn std::error::Error>> {
    let ebb_db_path = db_manager::get_default_ebb_db_path();
    let db_manager = db_manager::DbManager::new(&ebb_db_path).await?;
    let device_service = DeviceService::new_with_pool(db_manager.pool);
    match device_service.get_idle_sensitivity().await {
        Ok(idle_sensitivity) => Ok(idle_sensitivity),
        Err(e) => Err(format!("error getting idle sensitivity: {}", e).into()),
    }
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

async fn thirty_second_loop(app_handle: tauri::AppHandle) {
    loop {
        log::info!("Thirty second loop");
        app_handle.emit("online-ping", ()).unwrap_or_else(|e| {
            log::error!("Failed to emit on-thirty-second-loop event: {}", e);
        });
        sleep(Duration::from_secs(30)).await;
    }
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
        let db_path = db_manager::get_default_codeclimbers_db_path();

        let monitor = Monitor::new();
        let mut app_receiver = monitor.subscribe();
        let register_blocked_handle_clone = app_handle.clone();

        let idle_sensitivity = get_idle_sensitivity().await.unwrap_or(60);

        // Initialize monitoring service first
        MonitoringConfig::new(Arc::new(monitor), db_path)
            .with_interval(Duration::from_secs(idle_sensitivity as u64))
            .initialize()
            .await;
        log::info!("Monitor initialized");

        async_runtime::spawn(thirty_second_loop(app_handle.clone()));

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
