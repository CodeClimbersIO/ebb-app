// use monitor::{EventCallback, InputMonitor, KeyboardEvent, MouseEvent, WindowEvent};
// use tauri::Emitter;

// struct TauriEventCallback {
//     app: tauri::AppHandle,
// }

// impl EventCallback for TauriEventCallback {
//     fn on_mouse_event(&self, event: MouseEvent) {
//         _ = self.app.emit("mouse-event", event);
//     }

//     fn on_keyboard_event(&self, event: KeyboardEvent) {
//         _ = self.app.emit("keyboard-event", event);
//     }

//     fn on_window_event(&self, event: WindowEvent) {
//         println!("window event: {:?}", event);
//         _ = self.app.emit("window-focus", event);
//     }
// }

pub fn start_monitoring() {
    activities_service::start_monitoring();
    // let callback = TauriEventCallback { app };
    // let monitor = InputMonitor::new(callback);
    // if let Err(e) = monitor.start() {
    //     eprintln!("Failed to start monitor: {}", e);
    // };
}
