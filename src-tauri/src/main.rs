use ebb_db::{db_manager, migrations, services::device_service::DeviceService};
use tauri::Manager;
use tokio;

mod autostart;
mod commands;
mod notification;
mod system_monitor;
mod tray_icon_gen;
mod window;

use autostart::{change_autostart, enable_autostart};

async fn initialize_device_profile() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let ebb_db_path = db_manager::get_default_ebb_db_path();
    let db_manager = db_manager::DbManager::new(&ebb_db_path).await?;
    let device_service = DeviceService::new_with_pool(db_manager.pool);
    let device_profile = device_service.get_device_profile().await;
    match device_profile {
        Ok(device_profile) => println!("device_profile: {:?}", device_profile),
        Err(e) => println!("error getting device id: {}", e),
    }
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let _guard = sentry::init(("https://d23e3cf5027dc14dfe8128f4d35219f7@o4508951187554304.ingest.us.sentry.io/4508951212851200", sentry::ClientOptions {
        release: sentry::release_name!(),
        ..Default::default()
    }));

    tauri::async_runtime::set(tokio::runtime::Handle::current());
    let db_path = db_manager::get_default_ebb_db_path();
    let path = std::path::Path::new(&db_path);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).expect("Failed to create directory");
    }

    let migrations = migrations::get_migrations();
    tauri::Builder::default()
        .plugin(tauri_nspanel::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
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
                .level(log::LevelFilter::Info)
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
            enable_autostart(app);
            tauri::async_runtime::spawn(async move { initialize_device_profile().await });

            Ok(())
        })
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_process::init())
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
            commands::snooze_blocking,
            commands::is_monitoring_running,
            commands::reset_app_data_for_testing,
            commands::restore_app_data_from_backup,
            commands::detect_spotify,
            commands::get_app_version,
            commands::show_notification,
            commands::hide_notification,
            change_autostart,
            tray_icon_gen::generate_timer_icon,
        ])
        .build(tauri::generate_context!())?
        .run(
            |app: &tauri::AppHandle<tauri::Wry>, event: tauri::RunEvent| match event {
                tauri::RunEvent::Reopen { .. } => {
                    if let Some(window) = app.get_webview_window("main") {
                        window.show().unwrap();
                        // window.set_focus().unwrap();
                    }
                }
                _ => {}
            },
        );
    Ok(())
}
