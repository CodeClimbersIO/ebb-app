use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::OffsetDateTime;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Device {
    pub id: String,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}

impl Device {
    pub fn new() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            created_at: OffsetDateTime::now_utc(),
            updated_at: OffsetDateTime::now_utc(),
        }
    }
}
