#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub(crate) use macos::*;

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "windows")]
pub(crate) use windows::*;

use crate::event::EventCallback;
use std::sync::Arc;

pub fn detect_changes() {
    platform_detect_changes();
}

pub fn initialize_callback(callback: Arc<dyn EventCallback>) {
    platform_initialize_callback(callback);
}
