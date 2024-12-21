use std::sync::Arc;

use monitor::{
    detect_changes, initialize_callback, EventCallback, KeyboardEvent, MonitorError, MouseEvent,
    WindowEvent,
};
mod utils;

struct MonitorCallback {}

impl EventCallback for MonitorCallback {
    fn on_keyboard_events(&self, events: Vec<KeyboardEvent>) {
        println!("Keyboard event: {:?}", events);
    }

    fn on_mouse_events(&self, events: Vec<MouseEvent>) {
        println!("Mouse event: {:?}", events);
    }

    fn on_window_event(&self, event: WindowEvent) {
        println!("Window event: {:?}", event);
    }
}

fn main() -> Result<(), MonitorError> {
    println!("main.rs starting");

    initialize_callback(Arc::new(MonitorCallback {})).expect("Failed to initialize callback");
    loop {
        detect_changes().expect("Failed to detect changes");
        std::thread::sleep(std::time::Duration::from_secs(1));
    }
}
