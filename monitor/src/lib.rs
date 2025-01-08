mod bindings;
mod error;
mod event;
mod platform;

pub use error::MonitorError;
pub use event::{
    EventCallback, KeyboardEvent, MouseEvent, MouseEventType, WindowEvent, WindowEventType,
};
pub use platform::{detect_changes, initialize_callback};
