use std::ffi::c_char;

#[repr(C)]
pub struct RawWindowTitle {
    pub app_name: *const c_char,
    pub window_title: *const c_char,
    url: *const c_char,
}

impl RawWindowTitle {
    pub fn get_url(&self) -> Option<String> {
        if self.url.is_null() {
            None
        } else {
            // Safe conversion from raw pointer to Option<&str>
            unsafe {
                Some(
                    std::ffi::CStr::from_ptr(self.url)
                        .to_str()
                        .ok()?
                        .to_string(),
                )
            }
        }
    }
}

#[cfg(target_os = "macos")]
#[link(name = "MacMonitor")]
extern "C" {
    pub fn detect_focused_window() -> *const RawWindowTitle;
    pub fn start_mouse_monitoring(callback: extern "C" fn(f64, f64, i32, i32));
    pub fn start_keyboard_monitoring(callback: extern "C" fn(i32));
    pub fn process_events();
}

#[cfg(target_os = "windows")]
#[link(name = "WindowsMonitor")]
extern "C" {
    pub fn initialize();
    pub fn start_mouse_monitoring(callback: extern "C" fn(f64, f64, i32, i32));
    pub fn start_keyboard_monitoring(callback: extern "C" fn(i32));
    pub fn start_window_monitoring(
        callback: extern "C" fn(
            window_title: *const c_char,
            window_class: *const c_char,
            process_name: *const c_char,
        ),
    );
    pub fn process_events();
    pub fn cleanup();
}
