extern crate dotenv;
use dotenv::dotenv;
use monitor::{EventCallback, InputMonitor, KeyboardEvent, MouseEvent, WindowEvent};

use crate::{db::db_manager, ActivityService};

enum MonitorEvent {
    Mouse(MouseEvent),
    Keyboard(KeyboardEvent),
    Window(WindowEvent),
}

struct WindowEventCallback {
    event_sender: tokio::sync::mpsc::UnboundedSender<MonitorEvent>,
}

impl EventCallback for WindowEventCallback {
    fn on_mouse_event(&self, event: MouseEvent) {
        println!("mouse event: {:?}", event);
        self.event_sender.send(MonitorEvent::Mouse(event)).unwrap();
    }

    fn on_keyboard_event(&self, event: KeyboardEvent) {
        println!("keyboard event: {:?}", event);
        self.event_sender
            .send(MonitorEvent::Keyboard(event))
            .unwrap();
    }

    fn on_window_event(&self, event: WindowEvent) {
        println!("window event: {:?}", event);
        self.event_sender.send(MonitorEvent::Window(event)).unwrap();
    }
}

pub fn start_monitoring() {
    println!("monitoring starting");
    dotenv().ok();

    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();

    let callback = WindowEventCallback { event_sender: tx };
    tokio::spawn(async move {
        let db_path = db_manager::get_db_path();
        let db_manager = db_manager::DbManager::new(&db_path).await.unwrap();

        let activity_service = ActivityService::new(db_manager.pool);

        let service = activity_service.clone();
        while let Some(event) = rx.recv().await {
            match event {
                MonitorEvent::Mouse(e) => service.on_mouse_event(e).await,
                MonitorEvent::Keyboard(e) => service.on_keyboard_event(e).await,
                MonitorEvent::Window(e) => service.on_window_event(e).await,
            }
        }
    });

    let monitor = InputMonitor::new(callback);
    if let Err(e) = monitor.start() {
        eprintln!("Failed to start monitor: {}", e);
    };
}
