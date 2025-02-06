use chrono::Local;
use std::fs::OpenOptions;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::SystemTime;

use os_monitor::{detect_changes, initialize_monitor, Monitor};
use os_monitor_service::{enable_log as enable_log_service, initialize_monitoring_service};

use tauri::async_runtime;
use tauri::AppHandle;
use tokio::time::{sleep, Duration};

// Shared counter for main thread operations
static LAST_MAIN_THREAD_COMPLETION: AtomicU64 = AtomicU64::new(0);

pub fn get_default_db_path() -> String {
    let home_dir = dirs::home_dir().expect("Could not find home directory");
    home_dir
        .join(".codeclimbers")
        .join("codeclimbers-desktop.sqlite")
        .to_str()
        .expect("Invalid path")
        .to_string()
}

pub fn start_monitoring(app: AppHandle) {
    cc_logger::log("Starting monitoring service...");

    // Start heartbeat monitoring in a separate task
    start_heartbeat_monitor();
    enable_log_service();

    async_runtime::spawn(async move {
        cc_logger::log("Initializing monitor in async runtime...");
        let db_path = get_default_db_path();
        let monitor = Arc::new(Monitor::new());
        initialize_monitor(monitor.clone()).expect("Failed to initialize monitor");
        initialize_monitoring_service(monitor.clone(), db_path).await;
        cc_logger::log("Monitor initialized");

        loop {
            cc_logger::log("Monitor loop iteration starting");
            sleep(Duration::from_secs(1)).await;
            let start = std::time::Instant::now();

            let _ = app
                .run_on_main_thread(move || {
                    cc_logger::log("Executing on main thread");
                    let result = detect_changes();
                    cc_logger::log(&format!(
                        "Main thread execution completed in {:?}",
                        start.elapsed()
                    ));

                    // Only update completion time after successful main thread operation
                    update_main_thread_completion();

                    result.expect("Failed to detect changes");
                })
                .unwrap_or_else(|e| {
                    cc_logger::log(&format!("Failed to run on main thread: {}", e));
                    panic!("Failed to run on main thread: {}", e);
                });

            cc_logger::log("Monitor loop iteration completed");
        }
    });
}

fn update_main_thread_completion() {
    LAST_MAIN_THREAD_COMPLETION.store(
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        Ordering::SeqCst,
    );
}

fn start_heartbeat_monitor() {
    // Spawn a dedicated OS thread for monitoring
    thread::Builder::new()
        .name("heartbeat-monitor".into())
        .spawn(move || {
            const HEARTBEAT_CHECK_INTERVAL: Duration = Duration::from_secs(5);
            const MAIN_THREAD_TIMEOUT: Duration = Duration::from_secs(10);

            loop {
                thread::sleep(HEARTBEAT_CHECK_INTERVAL);

                let last_completion = LAST_MAIN_THREAD_COMPLETION.load(Ordering::SeqCst);
                let now = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs();

                if now - last_completion > MAIN_THREAD_TIMEOUT.as_secs() {
                    eprintln!(
                        "WARNING: Main thread operation timeout detected! Last completion: {}s ago",
                        now - last_completion
                    );

                    // Log to a file since stderr might be blocked
                    log_error_to_file(&format!(
                        "Main thread timeout detected at {}. Last completion: {}s ago",
                        now,
                        now - last_completion
                    ));

                    // Attempt recovery in a separate thread to avoid being blocked
                    attempt_recovery();
                }
            }
        })
        .expect("Failed to spawn heartbeat monitor thread");
}

fn attempt_recovery() {
    // Spawn a new thread for recovery to avoid being blocked by the main thread
    thread::Builder::new()
        .name("recovery-worker".into())
        .spawn(move || {
            eprintln!("Attempting monitoring service recovery...");

            // 1. Log system state
            log_system_state();

            // 2. Attempt to generate thread dump
            generate_thread_dump();

            // 3. Consider forcefully terminating the application
            restart_application();
            // This is a last resort option that should be carefully considered
            if cfg!(debug_assertions) {
                eprintln!("In debug mode: would terminate application here");
            } else {
                // std::process::exit(1); // Enable if you want to force quit
            }
        })
        .expect("Failed to spawn recovery thread");
}

fn restart_application() {
    log_error_to_file("Initiating application restart...");

    if let Ok(current_exe) = std::env::current_exe() {
        // Create logs directory if it doesn't exist
        let logs_dir = PathBuf::from("logs");
        std::fs::create_dir_all(&logs_dir).expect("Failed to create logs directory");

        // Generate timestamp for log files
        let timestamp = Local::now().format("%Y%m%d_%H%M%S");

        // Create log files with timestamp
        let stdout_log = logs_dir.join(format!("app_{}.log", timestamp));
        let stderr_log = logs_dir.join(format!("error_{}.log", timestamp));

        // Get absolute paths
        let stdout_absolute = stdout_log.canonicalize().unwrap_or_else(|_| {
            std::env::current_dir()
                .unwrap_or_default()
                .join(&stdout_log)
        });
        let stderr_absolute = stderr_log.canonicalize().unwrap_or_else(|_| {
            std::env::current_dir()
                .unwrap_or_default()
                .join(&stderr_log)
        });

        // Log the absolute paths
        cc_logger::log(&format!(
            "New instance stdout will be logged to: {}",
            stdout_absolute.display()
        ));
        cc_logger::log(&format!(
            "New instance stderr will be logged to: {}",
            stderr_absolute.display()
        ));

        log_error_to_file(&format!(
            "New instance logs will be written to:\nstdout: {}\nstderr: {}",
            stdout_absolute.display(),
            stderr_absolute.display()
        ));

        // Get absolute paths for better visibility
        let stdout_absolute = stdout_log.canonicalize().unwrap_or(stdout_log.clone());
        let stderr_absolute = stderr_log.canonicalize().unwrap_or(stderr_log.clone());

        // Open log files
        let log_file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&stdout_absolute)
            .expect("Failed to open log file");

        let error_log = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&stderr_absolute)
            .expect("Failed to open error log file");

        match std::process::Command::new(current_exe)
            .args(std::env::args().skip(1))
            .arg("--restarted")
            .arg(format!("--log-path={}", stdout_absolute.display()))
            .stdout(std::process::Stdio::from(log_file))
            .stderr(std::process::Stdio::from(error_log))
            .spawn()
        {
            Ok(_) => {
                log_error_to_file(&format!(
                    "Successfully spawned new instance.\nLog files are at:\n  stdout: {}\n  stderr: {}", 
                    stdout_absolute.display(),
                    stderr_absolute.display()
                ));
                cc_logger::log(&format!(
                    "Application restarting. Log files are at:\n  stdout: {}\n  stderr: {}",
                    stdout_absolute.display(),
                    stderr_absolute.display()
                ));
                thread::sleep(Duration::from_secs(1));
                std::process::exit(0);
            }
            Err(e) => {
                log_error_to_file(&format!("Failed to restart application: {}", e));
                eprintln!("Failed to restart application: {}", e);
            }
        }
    } else {
        log_error_to_file("Failed to get current executable path");
        eprintln!("Failed to get current executable path");
    }
}

fn log_error_to_file(message: &str) {
    use std::fs::OpenOptions;
    use std::io::Write;

    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open("monitor_errors.log")
    {
        let timestamp = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        if writeln!(file, "[{}] {}", timestamp, message).is_err() {
            eprintln!("Failed to write to error log file");
        }
    }
}

fn log_system_state() {
    let state = format!(
        "System State:\n\
        Time: {}\n\
        Current Thread: {:?}\n\
        Memory Usage: {:?}\n",
        SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        std::thread::current().id(),
        get_memory_usage()
    );
    log_error_to_file(&state);
}

fn generate_thread_dump() {
    // This is a placeholder - actual thread dump implementation
    // would be platform-specific
    #[cfg(target_os = "linux")]
    {
        if let Ok(pid) = std::process::id() {
            let _ = std::process::Command::new("kill")
                .args(["-3", &pid.to_string()])
                .output();
        }
    }
    #[cfg(target_os = "macos")]
    {
        let pid = std::process::id();
        let _ = std::process::Command::new("kill")
            .args(["-SIGINFO", &pid.to_string()])
            .output();
    }
}

fn get_memory_usage() -> Option<String> {
    // Platform-specific memory usage information
    #[cfg(target_os = "linux")]
    {
        if let Ok(contents) = std::fs::read_to_string("/proc/self/status") {
            return Some(contents);
        }
    }
    #[cfg(target_os = "macos")]
    {
        if let Ok(output) = std::process::Command::new("ps")
            .args(["o", "rss=", "-p", &std::process::id().to_string()])
            .output()
        {
            if let Ok(memory) = String::from_utf8(output.stdout) {
                return Some(format!("Memory (RSS): {} KB", memory.trim()));
            }
        }
    }
    None
}
