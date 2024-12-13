use monitor::{KeyboardEvent, MouseEvent, WindowEvent};
use sqlx::Row;
use time::OffsetDateTime;

#[derive(Debug, sqlx::Type, PartialEq)]
#[sqlx(type_name = "TEXT", rename_all = "UPPERCASE")]
pub enum ActivityType {
    Keyboard,
    Mouse,
    Window,
}

impl From<String> for ActivityType {
    fn from(s: String) -> Self {
        match s.as_str() {
            "MOUSE" => ActivityType::Mouse,
            "KEYBOARD" => ActivityType::Keyboard,
            "WINDOW" => ActivityType::Window,
            _ => panic!("Unknown activity type: {}", s), // Or handle invalid types differently
        }
    }
}

pub struct Activity {
    pub id: Option<i64>,
    pub created_at: Option<OffsetDateTime>,
    pub timestamp: Option<OffsetDateTime>,
    pub activity_type: ActivityType,
    pub app_name: Option<String>,
    pub app_window_title: Option<String>,
    pub mouse_x: Option<f64>,
    pub mouse_y: Option<f64>,
}

impl<'r> sqlx::FromRow<'r, sqlx::sqlite::SqliteRow> for Activity {
    fn from_row(row: &'r sqlx::sqlite::SqliteRow) -> Result<Self, sqlx::Error> {
        Ok(Activity {
            id: row.try_get("id")?,
            created_at: row.try_get("created_at")?,
            timestamp: row.try_get("timestamp")?,
            activity_type: row.try_get("activity_type")?,
            app_name: row.try_get("app_name")?,
            app_window_title: row.try_get("app_window_title")?,
            mouse_x: row.try_get("mouse_x")?,
            mouse_y: row.try_get("mouse_y")?,
        })
    }
}

impl Activity {
    fn new(activity_type: ActivityType) -> Self {
        Activity {
            id: None,
            created_at: Some(OffsetDateTime::now_utc()),
            timestamp: Some(OffsetDateTime::now_utc()),
            activity_type,
            app_name: None,
            app_window_title: None,
            mouse_x: None,
            mouse_y: None,
        }
    }

    pub fn create_window_activity(event: &WindowEvent) -> Self {
        let mut activity = Self::new(ActivityType::Window);
        activity.app_name = Some(event.app_name.clone());
        activity.app_window_title = Some(event.title.clone());
        activity
    }

    pub fn create_mouse_activity(event: &MouseEvent) -> Self {
        let mut activity = Self::new(ActivityType::Mouse);
        activity.mouse_x = Some(event.x);
        activity.mouse_y = Some(event.y);
        activity
    }

    pub fn create_keyboard_activity(event: &KeyboardEvent) -> Self {
        let activity = Self::new(ActivityType::Keyboard);
        activity
    }

    #[cfg(test)]
    pub fn __create_test_window() -> Self {
        Self::create_window_activity(&WindowEvent {
            app_name: "Cursor".to_string(),
            title: "main.rs - app-codeclimbers".to_string(),
        })
    }

    #[cfg(test)]
    pub fn __create_test_mouse() -> Self {
        use monitor::MouseEventType;

        Self::create_mouse_activity(&MouseEvent {
            x: 127.32,
            y: 300.81,
            event_type: MouseEventType::Move,
            scroll_delta: 0,
        })
    }

    #[cfg(test)]
    pub fn __create_test_keyboard() -> Self {
        use monitor::KeyboardEvent;

        Self::create_keyboard_activity(&KeyboardEvent { key_code: 65 })
    }
}
