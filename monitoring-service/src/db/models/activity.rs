use os_monitor::WindowEvent;
use sqlx::Row;
use time::OffsetDateTime;

#[derive(Debug, sqlx::Type, PartialEq, Clone)]
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

#[derive(Clone, Debug)]
pub struct Activity {
    pub id: Option<i64>,
    pub created_at: Option<OffsetDateTime>,
    pub timestamp: Option<OffsetDateTime>,
    pub activity_type: ActivityType,
    pub app_name: Option<String>,
    pub app_window_title: Option<String>,
    pub url: Option<String>,
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
            url: row.try_get("url")?,
        })
    }
}

impl Activity {
    pub fn new(
        activity_type: ActivityType,
        app_name: Option<String>,
        app_window_title: Option<String>,
        url: Option<String>,
        timestamp: OffsetDateTime,
    ) -> Self {
        Activity {
            id: None,
            created_at: Some(OffsetDateTime::now_utc()),
            timestamp: Some(timestamp),
            activity_type,
            app_name,
            app_window_title,
            url,
        }
    }

    pub fn create_window_activity(event: &WindowEvent) -> Self {
        Self::new(
            ActivityType::Window,
            Some(event.app_name.clone()),
            Some(event.window_title.clone()),
            event.url.clone(),
            OffsetDateTime::now_utc(),
        )
    }

    pub fn create_mouse_activity() -> Self {
        Self::new(
            ActivityType::Mouse,
            None,
            None,
            None,
            OffsetDateTime::now_utc(),
        )
    }

    pub fn create_keyboard_activity() -> Self {
        Self::new(
            ActivityType::Keyboard,
            None,
            None,
            None,
            OffsetDateTime::now_utc(),
        )
    }

    #[cfg(test)]
    pub fn __create_test_window() -> Self {
        Self::create_window_activity(&WindowEvent {
            app_name: "Cursor".to_string(),
            window_title: "main.rs - app-codeclimbers".to_string(),
            url: None,
        })
    }
}
