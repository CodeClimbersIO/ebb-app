use crate::event::WindowEvent;
use crate::{bindings, event::EventCallback, Monitor};
use crate::{KeyboardEvent, MonitorError, MouseEvent, MouseEventType};
use once_cell::sync::Lazy;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

struct WindowTitle {
    app_name: String,
    title: String,
}

static MONITOR: Lazy<Mutex<Option<Arc<Monitor>>>> = Lazy::new(|| Mutex::new(None));

static MOUSE_EVENTS: Mutex<Vec<MouseEvent>> = Mutex::new(Vec::new());
static KEYBOARD_EVENTS: Mutex<Vec<KeyboardEvent>> = Mutex::new(Vec::new());

static LAST_SEND: Lazy<Mutex<Instant>> = Lazy::new(|| Mutex::new(Instant::now()));

static FOCUSED_WINDOW: Mutex<WindowTitle> = Mutex::new(WindowTitle {
    app_name: String::new(),
    title: String::new(),
});

fn detect_focused_window() {
    unsafe {
        let window_title: *const bindings::RawWindowTitle = bindings::detect_focused_window();
        if window_title.is_null() {
            return;
        }

        let title = std::ffi::CStr::from_ptr((*window_title).window_title)
            .to_str()
            .unwrap();
        let app_name = std::ffi::CStr::from_ptr((*window_title).app_name)
            .to_str()
            .unwrap();

        let url = (*window_title).get_url();

        {
            let mut window_title_guard = FOCUSED_WINDOW.lock().unwrap();
            let monitor_guard = MONITOR.lock().unwrap();
            if app_name.to_string() != window_title_guard.app_name
                || title.to_string() != window_title_guard.title
            {
                if let Some(monitor) = monitor_guard.as_ref() {
                    monitor.on_window_event(WindowEvent {
                        window_title: title.to_string(),
                        app_name: app_name.to_string(),
                        url: url,
                    });
                }
            }
            window_title_guard.title = title.to_string();
            window_title_guard.app_name = app_name.to_string();
        }
    }
}

extern "C" fn mouse_event_callback(x: f64, y: f64, event_type: i32, scroll_delta: i32) {
    let mouse_event = MouseEvent {
        x,
        y,
        event_type: MouseEventType::try_from(event_type).unwrap(),
        scroll_delta,
    };
    // Store event in vector
    let mut events = MOUSE_EVENTS.lock().unwrap();
    events.push(mouse_event);
}

extern "C" fn keyboard_event_callback(key_code: i32) {
    let keyboard_event = KeyboardEvent { key_code };
    // Store event in vector
    let mut events = KEYBOARD_EVENTS.lock().unwrap();
    events.push(keyboard_event);
}

fn send_buffered_events() {
    let monitor_guard = MONITOR.lock().unwrap();
    if let Some(monitor) = monitor_guard.as_ref() {
        // Send mouse events
        let mut mouse_events = MOUSE_EVENTS.lock().unwrap();
        monitor.on_mouse_events(mouse_events.drain(..).collect());

        // Send keyboard events
        let mut keyboard_events = KEYBOARD_EVENTS.lock().unwrap();
        monitor.on_keyboard_events(keyboard_events.drain(..).collect());
    }
}

pub(crate) fn platform_initialize_monitor(monitor: Arc<Monitor>) -> Result<(), MonitorError> {
    let mut monitor_guard = MONITOR.lock().unwrap();

    *monitor_guard = Some(monitor);

    unsafe {
        bindings::start_mouse_monitoring(mouse_event_callback);
        bindings::start_keyboard_monitoring(keyboard_event_callback);
    }
    Ok(())
}

pub(crate) fn platform_detect_changes() -> Result<(), MonitorError> {
    unsafe {
        bindings::process_events();
    }
    detect_focused_window();

    let mut last_send = LAST_SEND.lock().unwrap();
    if last_send.elapsed() >= Duration::from_secs(30) {
        send_buffered_events();
        *last_send = Instant::now();
    }
    Ok(())
}
