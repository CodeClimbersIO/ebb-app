use ebb_db::{db_manager, migrations, services::device_service::DeviceService, shared_sql_plugin};
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
    log::info!("Starting device profile initialization...");

    let ebb_db_path = db_manager::get_default_ebb_db_path();
    log::info!("Using database path: {}", ebb_db_path);

    // Use shared DbManager to ensure connection sharing with the SQL plugin
    let db_manager = db_manager::DbManager::get_shared(&ebb_db_path).await?;
    log::info!("Connected to shared database manager");

    let device_service = DeviceService::new_with_pool(db_manager.pool.clone());
    let device_profile = device_service.get_device_profile().await;
    match device_profile {
        Ok(device_profile) => log::info!("Device profile initialized: {:?}", device_profile),
        Err(e) => {
            log::error!("Error getting device profile: {}", e);
            return Err(e.into());
        }
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

    let shared_migrations = migrations::get_shared_migrations();

    // Create SQL plugin with migration notifier
    let (sql_builder, mut migration_rx) = shared_sql_plugin::Builder::new_with_notifier();

    // Spawn task to listen for migration completion and run initialization
    tauri::async_runtime::spawn(async move {
        if migration_rx.recv().await.is_ok() {
            if let Err(e) = initialize_device_profile().await {
                log::error!("Failed to initialize device profile: {}", e);
            }
        } else {
            log::warn!("Migration notification channel closed without receiving signal");
        }
    });

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

            Ok(())
        })
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_process::init())
        .plugin(
            sql_builder
                .add_migrations(&format!("sqlite:{db_path}"), shared_migrations)
                .build_with_config(shared_sql_plugin::PluginConfig {
                    preload: vec![format!("sqlite:{db_path}")],
                }),
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
            commands::notify_app_notification_dismissed,
            commands::notify_app_notification_created,
            commands::hide_notification,
            commands::notify_start_flow,
            commands::notify_view_flow_recap,
            commands::notify_add_time_event,
            commands::notify_snooze_blocking,
            commands::notify_end_session,
            change_autostart,
            tray_icon_gen::generate_timer_icon,
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
