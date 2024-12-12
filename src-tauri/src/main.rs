use std::thread;
use tokio;

mod system_monitor;

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

#[tokio::main]
async fn main() {
    tauri::async_runtime::set(tokio::runtime::Handle::current());
    println!("Main thread info: {}", get_thread_info());

    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();
            system_monitor::start_monitoring(app_handle);
            println!("setup thread info: {}", get_thread_info());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
