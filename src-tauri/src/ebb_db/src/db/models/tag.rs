use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::OffsetDateTime;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub parent_tag_id: Option<String>,
    pub tag_type: String,
    pub is_blocked: bool,
    pub is_default: bool,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}

impl Tag {
    pub fn new(
        id: String,
        name: String,
        parent_tag_id: Option<String>,
        tag_type: String,
        is_blocked: bool,
        is_default: bool,
    ) -> Self {
        let now = OffsetDateTime::now_utc();
        Self {
            id,
            name,
            parent_tag_id,
            tag_type,
            is_blocked,
            is_default,
            created_at: now,
            updated_at: now,
        }
    }
}