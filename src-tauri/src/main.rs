use tauri::Manager;
use tokio;
use tauri_plugin_dialog::DialogExt;

mod commands;
mod db;
mod system_monitor;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let _guard = sentry::init(("https://d23e3cf5027dc14dfe8128f4d35219f7@o4508951187554304.ingest.us.sentry.io/4508951212851200", sentry::ClientOptions {
        release: sentry::release_name!(),
        ..Default::default()
    }));

    tauri::async_runtime::set(tokio::runtime::Handle::current());
    let db_path = db::get_db_path();
    let path = std::path::Path::new(&db_path);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).expect("Failed to create directory");
    }

    let migrations = db::get_migrations();
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                window.hide().unwrap();
            }
            _ => {}
        }) // hides window instead of closing app when someone clicks the X button
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
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;
            Ok(())
        })
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations(&format!("sqlite:{db_path}"), migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            commands::get_app_icon,
            commands::check_accessibility_permissions,
            commands::request_system_permissions,
            commands::start_system_monitoring,
            commands::start_blocking,
            commands::stop_blocking,
            commands::is_monitoring_running,
            commands::reset_app_data_for_testing,
            commands::restore_app_data_from_backup,
            commands::detect_spotify,
        ])
        .build(tauri::generate_context!())?
        .run(|app: &tauri::AppHandle<tauri::Wry>, event: tauri::RunEvent| match event {
            tauri::RunEvent::ExitRequested { api, .. } => {
                // Prevent the exit and show confirmation dialog
                api.prevent_exit();
                
                let window = app.get_webview_window("main");
                if let Some(window) = window {
                    // Show the window if it's hidden
                    window.show().unwrap();
                    window.set_focus().unwrap();
                    
                    // Ask for confirmation using the newer dialog API
                    if app.dialog()
                        .message("Are you sure you want to quit?\nScreen time data will stop being generated and any active focus sessions will end.")
                        .title("Quit Ebb?")
                        .blocking_show() {
                        // User confirmed, actually quit the app
                        std::process::exit(0);
                    }
                }
            }
            tauri::RunEvent::Reopen { .. } => {
                if let Some(window) = app.get_webview_window("main") {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            _ => {}
        });
    Ok(())
}
