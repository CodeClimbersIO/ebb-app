use std::time::Duration;

use time::OffsetDateTime;

#[derive(Debug, sqlx::Type, PartialEq)]
#[sqlx(type_name = "TEXT", rename_all = "UPPERCASE")]
pub enum ActivityStateType {
    Active,
    Inactive,
}

impl From<String> for ActivityStateType {
    fn from(s: String) -> Self {
        match s.as_str() {
            "ACTIVE" => ActivityStateType::Active,
            "INACTIVE" => ActivityStateType::Inactive,
            _ => panic!("Unknown activity state: {}", s), // Or handle invalid types differently
        }
    }
}

#[derive(Debug, sqlx::FromRow, PartialEq)]
pub struct ActivityState {
    pub id: Option<i64>,
    pub state: ActivityStateType,
    pub app_switches: i64,
    pub start_time: Option<OffsetDateTime>,
    pub end_time: Option<OffsetDateTime>,
    pub created_at: Option<OffsetDateTime>,
}

impl ActivityState {
    pub fn new() -> Self {
        let now = OffsetDateTime::now_utc();
        ActivityState {
            id: None,
            state: ActivityStateType::Inactive,
            app_switches: 0,
            start_time: Some(now - Duration::from_secs(120)),
            end_time: Some(now),
            created_at: Some(now),
        }
    }
}
