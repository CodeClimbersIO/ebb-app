use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::OffsetDateTime;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Tide {
    pub id: String,
    pub start: OffsetDateTime,
    pub end: Option<OffsetDateTime>,
    pub metrics_type: String, // "creating", etc.
    pub tide_frequency: String, // "daily", "weekly", "monthly", "indefinite"
    pub goal_amount: f64,
    pub actual_amount: f64,
    pub tide_template_id: String,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}

impl Tide {
    pub fn new(
        start: OffsetDateTime,
        metrics_type: String,
        tide_frequency: String,
        goal_amount: f64,
        tide_template_id: String,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            start,
            end: None,
            metrics_type,
            tide_frequency,
            goal_amount,
            actual_amount: 0.0,
            tide_template_id,
            created_at: OffsetDateTime::now_utc(),
            updated_at: OffsetDateTime::now_utc(),
        }
    }

    pub fn from_template(template: &super::tide_template::TideTemplate, start: OffsetDateTime) -> Self {
        Self::new(
            start,
            template.metrics_type.clone(),
            template.tide_frequency.clone(),
            template.goal_amount,
            template.id.clone(),
        )
    }
}