use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::OffsetDateTime;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct TideTemplate {
    pub id: String,
    pub metrics_type: String, // "creating", etc.
    pub tide_frequency: String, // "daily", "weekly"
    pub goal_amount: f64,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}

impl TideTemplate {
    pub fn new(metrics_type: String, tide_frequency: String, goal_amount: f64) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            metrics_type,
            tide_frequency,
            goal_amount,
            created_at: OffsetDateTime::now_utc(),
            updated_at: OffsetDateTime::now_utc(),
        }
    }
}