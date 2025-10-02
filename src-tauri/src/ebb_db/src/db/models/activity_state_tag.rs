use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityStateTag {
    pub activity_state_id: String,
    pub tag_id: String,
    pub app_tag_id: Option<String>,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}

impl ActivityStateTag {
    pub fn new(
        activity_state_id: String,
        tag_id: String,
        app_tag_id: Option<String>,
    ) -> Self {
        let now = OffsetDateTime::now_utc();
        Self {
            activity_state_id,
            tag_id,
            app_tag_id,
            created_at: now,
            updated_at: now,
        }
    }
}