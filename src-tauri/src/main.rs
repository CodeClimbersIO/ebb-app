use monitor::{EventCallback, InputMonitor, KeyboardEvent, MouseEvent, WindowEvent};
use once_cell::sync::Lazy;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::Emitter;
use tauri::State;
use tauri_plugin_autostart::MacosLauncher;

static MONITOR: Lazy<Mutex<Option<InputMonitor>>> = Lazy::new(|| Mutex::new(None));

struct Counter(Arc<Mutex<i32>>);

unsafe impl Send for Counter {}
unsafe impl Sync for Counter {}

#[tauri::command]
async fn start_background_task(
    window: tauri::Window,
    counter: State<'_, Counter>,
) -> Result<(), String> {
    println!("Command handler thread info: {}", get_thread_info());
    let counter = Arc::clone(&counter.0);
    // Spawn a new thread for CPU-intensive work
    thread::Builder::new()
        .name("background-worker".into())
        .spawn(move || {
            println!("Background thread info: {}", get_thread_info());

            for i in 0..5 {
                // Simulate some work
                thread::sleep(Duration::from_secs(1));

                // Update shared state
                let mut count = counter.lock().unwrap();
                *count += 1;

                println!("Worker iteration {}, Thread info: {}", i, get_thread_info());

                // Emit event to frontend with thread information
                window
                    .emit("counter-update", {
                        let payload = serde_json::json!({
                            "count": *count,
                            "thread_info": get_thread_info()
                        });
                        payload
                    })
                    .unwrap();
            }
        })
        .map_err(|e| e.to_string())?;

    Ok(())
}

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

fn is_main_thread() -> bool {
    let current = thread::current();
    current.name().map_or(false, |name| name == "main")
}

struct TauriEventCallback {
    app: tauri::AppHandle,
}

impl EventCallback for TauriEventCallback {
    fn on_mouse_event(&self, event: MouseEvent) {
        _ = self.app.emit("mouse-event", event);
    }

    fn on_keyboard_event(&self, event: KeyboardEvent) {
        _ = self.app.emit("keyboard-event", event);
    }

    fn on_window_event(&self, event: WindowEvent) {
        _ = self.app.emit("window-focus", event);
    }
}

#[tauri::command(async_runtime::set = "main-thread")]
async fn start_monitoring(app: tauri::AppHandle) -> Result<(), String> {
    println!("start_monitoring");
    println!("start_monitoring thread info: {}", get_thread_info());
    if !is_main_thread() {
        println!("start_monitoring must be called from the main thread");
        // return Err("start_monitoring must be called from the main thread".to_string());
    }
    println!("start_monitoring is on the main thread");
    let mut monitor_guard = MONITOR.lock().unwrap();

    if monitor_guard.is_none() {
        let callback = TauriEventCallback { app };
        let monitor = InputMonitor::new(callback);

        monitor.start().map_err(|e| e.to_string())?;
        *monitor_guard = Some(monitor);
    }

    Ok(())
}

#[tauri::command(async_runtime::set = "main-thread")]
async fn stop_monitoring() -> Result<(), String> {
    println!("stop_monitoring");
    let mut monitor_guard = MONITOR.lock().unwrap();

    if let Some(monitor) = monitor_guard.take() {
        monitor.stop().map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn main() {
    println!("Main thread info: {}", get_thread_info());
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .manage(Counter(Arc::new(Mutex::new(0))))
        .invoke_handler(tauri::generate_handler![
            start_monitoring,
            stop_monitoring,
            start_background_task
        ])
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]),
        ))
        .setup(|app| {
            let app_handle = app.handle().clone();
            println!("setup");
            println!("setup thread info: {}", get_thread_info());
            let mut monitor_guard = MONITOR.lock().unwrap();

            if monitor_guard.is_none() {
                let callback = TauriEventCallback { app: app_handle };
                let monitor = InputMonitor::new(callback);

                monitor.start().map_err(|e| e.to_string())?;
                *monitor_guard = Some(monitor);
            }
            // Setup cleanup on app exit
            // let app_handle = app.handle();
            // let window = app.get_webview_window("main").unwrap();

            // window.li("tauri://close-requested", move |_| {
            //     let _ = stop_monitoring();
            //     app_handle.exit(0);
            // });
            // app.on_window_event(|event| {
            //     if let tauri::WindowEvent::CloseRequested { .. } = event.event() {
            //         let _ = stop_monitoring();
            //         app_handle.exit(0);
            //     }
            // });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
