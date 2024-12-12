use activities_service;
use tauri::async_runtime;
use tauri::AppHandle;
use tokio::time::{sleep, Duration};

pub fn start_monitoring(app: AppHandle) {
    async_runtime::spawn(async move {
        loop {
            sleep(Duration::from_secs(1)).await;
            let _ = app.run_on_main_thread(|| {
                activities_service::start_monitoring();
                println!("Running on main thread");
            });
        }
    });
}
