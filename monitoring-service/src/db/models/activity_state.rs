#[derive(Debug, sqlx::Type, PartialEq)]
#[sqlx(type_name = "TEXT", rename_all = "UPPERCASE")]
pub enum ActivityState {
    Active,
    Inactive,
}

impl From<String> for ActivityState {
    fn from(s: String) -> Self {
        match s.as_str() {
            "ACTIVE" => ActivityState::Active,
            "INACTIVE" => ActivityState::Inactive,
            _ => panic!("Unknown activity state: {}", s), // Or handle invalid types differently
        }
    }
}

pub struct ActivityState {
    pub id: Option<i64>,
    pub state: ActivityState,
    pub current_window_title: Option<String>,
    pub current_window_app_name: Option<String>,
    pub context_switches: i64,
    pub start_time: Option<OffsetDateTime>,
    pub end_time: Option<OffsetDateTime>,
    pub created_at: Option<OffsetDateTime>,
}

impl ActivityState {
    pub fn new() -> Self {
        let now = OffsetDateTime::now_utc();
        ActivityState {
            id: None,
            state: ActivityState::Inactive,
            current_window_title: None,
            current_window_app_name: None,
            context_switches: 0,
            start_time: Some(now - Duration::from_secs(120)),
            end_time: Some(now),
            created_at: Some(now),
        }
    }
}
