mod bindings;
mod error;
mod event;
mod platform;

pub use error::MonitorError;
pub use event::{
    EventCallback, KeyboardEvent, Monitor, MouseEvent, MouseEventType, WindowEvent, WindowEventType,
};
pub use platform::{detect_changes, initialize_monitor};
