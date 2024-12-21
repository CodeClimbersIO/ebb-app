use std::sync::Arc;

use monitor::{
    detect_changes, initialize_callback, EventCallback, KeyboardEvent, MonitorError, MouseEvent,
    WindowEvent,
};
mod utils;

struct MonitorCallback {}

impl EventCallback for MonitorCallback {
    fn on_keyboard_event(&self, event: KeyboardEvent) {
        println!("Keyboard event: {:?}", event);
    }

    fn on_mouse_event(&self, event: MouseEvent) {
        println!("Mouse event: {:?}", event);
    }

    fn on_window_event(&self, event: WindowEvent) {
        println!("Window event: {:?}", event);
    }
}

fn main() -> Result<(), MonitorError> {
    println!("main.rs starting");

    initialize_callback(Arc::new(MonitorCallback {}));
    loop {
        detect_changes();
        std::thread::sleep(std::time::Duration::from_secs(1));
    }
}
