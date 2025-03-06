use os_monitor::{
    get_application_icon_data, has_accessibility_permissions, request_accessibility_permissions,
    start_blocking as os_start_blocking, stop_blocking as os_stop_blocking,
};
use tauri::Manager;
use tokio;
mod db;
mod system_monitor;
use tauri::command;

#[command]
async fn get_app_icon(bundle_id: String) -> Result<String, String> {
    get_application_icon_data(&bundle_id).ok_or_else(|| "Failed to get app icon".to_string())
}

#[command]
fn start_blocking(blocking_urls: Vec<String>) {
    os_start_blocking(&blocking_urls, "https://ebb.cool/vibes");
}

#[command]
fn stop_blocking() {
    os_stop_blocking();
}

#[command]
fn check_accessibility_permissions() -> bool {
    has_accessibility_permissions()
}

#[command]
fn request_system_permissions() -> bool {
    request_accessibility_permissions()
}

#[command]
fn start_system_monitoring() {
    system_monitor::start_monitoring();
}

#[command]
fn is_monitoring_running() -> bool {
    system_monitor::is_monitoring_running()
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tauri::async_runtime::set(tokio::runtime::Handle::current());
    let db_path = db::get_db_path();
    let path = std::path::Path::new(&db_path);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).expect("Failed to create directory");
    }

    let migrations = db::get_migrations();
    tauri::Builder::default()
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                window.hide().unwrap();
            }
            _ => {}
        })
        .plugin(
            tauri_plugin_log::Builder::new()
                .clear_targets()
                .level(log::LevelFilter::Trace)
                .targets([
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("logs".to_string()),
                    }),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                ])
                .build(),
        )
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Regular);
            Ok(())
        })
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations(&format!("sqlite:{db_path}"), migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            get_app_icon,
            check_accessibility_permissions,
            request_system_permissions,
            start_system_monitoring,
            start_blocking,
            stop_blocking,
            is_monitoring_running
        ])
        .build(tauri::generate_context!())?
        .run(
            |app: &tauri::AppHandle<tauri::Wry>, event: tauri::RunEvent| match event {
                tauri::RunEvent::Reopen { .. } => {
                    if let Some(window) = app.get_webview_window("main") {
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                }
                _ => {}
            },
        );
    Ok(())
}
