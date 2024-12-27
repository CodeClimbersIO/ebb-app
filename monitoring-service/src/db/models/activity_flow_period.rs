use time::OffsetDateTime;

#[derive(Debug, sqlx::FromRow)]
pub struct ActivityFlowPeriod {
    pub id: Option<i64>,
    pub start_time: Option<OffsetDateTime>,
    pub end_time: Option<OffsetDateTime>,
    pub score: f64,
    pub app_switches: i64,
    pub inactive_time: i64,
    pub created_at: OffsetDateTime,
}
