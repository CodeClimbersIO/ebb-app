use std::thread;
use tauri_plugin_autostart::MacosLauncher;
mod window_monitor;

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

fn main() {
    println!("Main thread info: {}", get_thread_info());
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]),
        ))
        .setup(|app| {
            println!("setup");
            println!("setup thread info: {}", get_thread_info());
            window_monitor::start_monitoring();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
