use chrono::{DateTime, Utc};

#[derive(Debug, sqlx::Type)]
#[sqlx(type_name = "TEXT", rename_all = "UPPERCASE")]
pub enum ActivityType {
    Window,
    Mouse,
    Keyboard,
}

pub struct Activity {
    pub id: i32,
    pub created_at: DateTime<Utc>,
    pub timestamp: DateTime<Utc>,
    pub activity_type: ActivityType,
    pub app_name: Option<String>,
    pub app_window_title: Option<String>,
    pub mouse_x: Option<f32>,
    pub mouse_y: Option<f32>,
}

impl Activity {
    pub fn __create_test_window() -> Self {
        Activity {
            id: 1,
            created_at: Utc::now(),
            timestamp: Utc::now(),
            activity_type: ActivityType::Window,
            app_name: Some("Cursor".to_string()),
            app_window_title: Some("main.rs - app-codeclimbers".to_string()),
            mouse_x: None,
            mouse_y: None,
        }
    }

    pub fn __create_test_mouse() -> Self {
        Activity {
            id: 1,
            created_at: Utc::now(),
            timestamp: Utc::now(),
            activity_type: ActivityType::Mouse,
            app_name: None,
            app_window_title: None,
            mouse_x: Some(127.32),
            mouse_y: Some(300.81),
        }
    }

    pub fn __create_test_keyboard() -> Self {
        Activity {
            id: 1,
            created_at: Utc::now(),
            timestamp: Utc::now(),
            activity_type: ActivityType::Keyboard,
            app_name: None,
            app_window_title: None,
            mouse_x: None,
            mouse_y: None,
        }
    }
}
