use time::OffsetDateTime;

#[derive(Debug, sqlx::FromRow)]
pub struct ActivityFlowPeriod {
    pub id: Option<i64>,
    pub start_time: OffsetDateTime,
    pub end_time: OffsetDateTime,
    pub score: f64,
    pub app_switches: i64,
    pub inactive_time: i64,
    pub created_at: OffsetDateTime,
}
