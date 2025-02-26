use os_monitor::{get_application_icon_data, has_accessibility_permissions, request_accessibility_permissions};
use std::thread;
use tauri::Manager;
use tokio;
mod db;
mod system_monitor;
use tauri::command;

fn get_thread_info() -> String {
    let current = thread::current();
    let is_main = current.name().map_or(false, |name| name == "main");

    format!(
        "Thread ID: {:?}, Thread Name: {:?}, Is Main: {}",
        current.id(),
        current.name().unwrap_or("unnamed"),
        is_main
    )
}

#[command]
async fn get_app_icon(bundle_id: String) -> Result<String, String> {
    get_application_icon_data(&bundle_id).ok_or_else(|| "Failed to get app icon".to_string())
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
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Regular);
            system_monitor::start_monitoring();
            println!("setup thread info: {}", get_thread_info());
            Ok(())
        })
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_app_icon,
            check_accessibility_permissions,
            request_system_permissions,
            start_system_monitoring
        ])
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations(&format!("sqlite:{db_path}"), migrations)
                .build(),
        )
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("logs".to_string()),
                    },
                ))
                .build(),
        )
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
