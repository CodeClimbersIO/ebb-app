use crate::bindings;
use crate::error::MonitorError;
use crate::event::{KeyboardEvent, MouseEvent, MouseEventType, WindowEvent};
use crate::monitor::EventCallback;
use once_cell::sync::Lazy;
use std::ffi::CStr;
use std::sync::Mutex;

pub(crate) struct WindowsMonitor;

impl super::PlatformMonitor for WindowsMonitor {
    fn platform_start_monitoring(callback: &dyn EventCallback) -> Result<(), MonitorError> {
        let callback_static = unsafe { std::mem::transmute(callback) };
        let mut callback_guard = CALLBACK.lock().unwrap();
        *callback_guard = Some(callback_static);

        // ... rest of the Windows implementation ...
        Ok(())
    }

    fn platform_stop_monitoring() -> Result<(), MonitorError> {
        // ... Windows cleanup implementation ...
        Ok(())
    }
}

// Store callback statically for FFI functions
static CALLBACK: Lazy<Mutex<Option<&'static dyn EventCallback>>> = Lazy::new(|| Mutex::new(None));

// Convert Windows-specific event types to our common event types
fn convert_mouse_event_type(event_type: i32) -> Option<MouseEventType> {
    match event_type {
        0 => Some(MouseEventType::Move),
        1 => Some(MouseEventType::LeftDown),
        2 => Some(MouseEventType::LeftUp),
        3 => Some(MouseEventType::RightDown),
        4 => Some(MouseEventType::RightUp),
        5 => Some(MouseEventType::MiddleDown),
        6 => Some(MouseEventType::MiddleUp),
        7 => Some(MouseEventType::Scroll),
        _ => None,
    }
}

extern "C" fn mouse_callback(x: f64, y: f64, event_type: i32, scroll_delta: i32) {
    if let Some(callback) = *CALLBACK.lock().unwrap() {
        if let Some(event_type) = convert_mouse_event_type(event_type) {
            let event = MouseEvent {
                x,
                y,
                event_type,
                scroll_delta,
            };
            callback.on_mouse_event(event);
        }
    }
}

extern "C" fn keyboard_callback(event_type: i32) {
    if let Some(callback) = *CALLBACK.lock().unwrap() {
        // Windows sends 0 for KEY_DOWN and 1 for KEY_UP
        let event = KeyboardEvent {
            key_code: event_type,
            is_down: event_type == 0,
        };
        callback.on_keyboard_event(event);
    }
}

extern "C" fn window_callback(
    window_title: *const std::ffi::c_char,
    window_class: *const std::ffi::c_char,
    process_name: *const std::ffi::c_char,
) {
    if let Some(callback) = *CALLBACK.lock().unwrap() {
        // Safely convert C strings to Rust strings
        let title = unsafe { CStr::from_ptr(window_title).to_string_lossy().into_owned() };

        let class = unsafe { CStr::from_ptr(window_class).to_string_lossy().into_owned() };

        let process = unsafe { CStr::from_ptr(process_name).to_string_lossy().into_owned() };

        let event = WindowEvent {
            title,
            class,
            process,
        };

        callback.on_window_event(event);
    }
}

// Windows-specific background thread for processing messages
struct MessageLoop {
    thread: Option<std::thread::JoinHandle<()>>,
    running: std::sync::Arc<std::sync::atomic::AtomicBool>,
}

static MESSAGE_LOOP: Lazy<Mutex<MessageLoop>> = Lazy::new(|| {
    Mutex::new(MessageLoop {
        thread: None,
        running: std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false)),
    })
});

pub(crate) fn platform_start_monitoring(
    callback: &'static dyn EventCallback,
) -> Result<(), MonitorError> {
    let mut callback_guard = CALLBACK.lock().unwrap();
    *callback_guard = Some(callback);

    // Initialize the Windows hooks
    unsafe {
        bindings::initialize();
        bindings::start_mouse_monitoring(mouse_callback);
        bindings::start_keyboard_monitoring(keyboard_callback);
        bindings::start_window_monitoring(window_callback);
    }

    // Start the Windows message loop in a background thread
    let mut message_loop = MESSAGE_LOOP.lock().unwrap();
    let running = message_loop.running.clone();
    running.store(true, std::sync::atomic::Ordering::SeqCst);

    let thread = std::thread::Builder::new()
        .name("windows-message-loop".into())
        .spawn(move || {
            while running.load(std::sync::atomic::Ordering::SeqCst) {
                unsafe {
                    bindings::process_events();
                }
                // Small sleep to prevent excessive CPU usage
                std::thread::sleep(std::time::Duration::from_millis(16)); // ~60 FPS
            }
        })
        .map_err(|e| {
            MonitorError::PlatformError(format!("Failed to spawn message loop thread: {}", e))
        })?;

    message_loop.thread = Some(thread);

    Ok(())
}

pub(crate) fn platform_stop_monitoring() -> Result<(), MonitorError> {
    // Stop the message loop thread
    let mut message_loop = MESSAGE_LOOP.lock().unwrap();
    if let Some(thread) = message_loop.thread.take() {
        message_loop
            .running
            .store(false, std::sync::atomic::Ordering::SeqCst);
        thread.join().map_err(|_| {
            MonitorError::PlatformError("Failed to join message loop thread".into())
        })?;
    }

    // Cleanup Windows hooks
    unsafe {
        bindings::cleanup();
    }

    // Clear the callback
    let mut callback_guard = CALLBACK.lock().unwrap();
    *callback_guard = None;

    Ok(())
}

// Internal helper to check if we're running on Windows
#[cfg(test)]
pub(crate) fn is_windows() -> bool {
    cfg!(target_os = "windows")
}

impl Drop for MessageLoop {
    fn drop(&mut self) {
        if let Some(thread) = self.thread.take() {
            self.running
                .store(false, std::sync::atomic::Ordering::SeqCst);
            let _ = thread.join();
        }
    }
}
