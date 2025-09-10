use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::OffsetDateTime;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ActivityState {
    pub id: i64,
    pub state: String, // 'ACTIVE' or 'INACTIVE'
    pub app_switches: i64,
    pub start_time: OffsetDateTime,
    pub end_time: OffsetDateTime,
    pub created_at: OffsetDateTime,
}

impl ActivityState {
    pub fn new(
        state: String,
        app_switches: i64,
        start_time: OffsetDateTime,
        end_time: OffsetDateTime,
    ) -> Self {
        Self {
            id: 0, // Will be set by database
            state,
            app_switches,
            start_time,
            end_time,
            created_at: OffsetDateTime::now_utc(),
        }
    }

    /// Calculate the duration of this activity state in minutes
    pub fn duration_minutes(&self) -> f64 {
        let duration = self.end_time - self.start_time;
        duration.whole_minutes() as f64 + (duration.subsec_milliseconds() as f64 / 60000.0)
    }

    /// Check if this activity state overlaps with a given time range
    pub fn overlaps_with(&self, start: OffsetDateTime, end: OffsetDateTime) -> bool {
        self.start_time < end && self.end_time > start
    }

    /// Get the overlapping duration with a given time range in minutes
    pub fn overlap_duration_minutes(&self, start: OffsetDateTime, end: OffsetDateTime) -> f64 {
        if !self.overlaps_with(start, end) {
            return 0.0;
        }

        let overlap_start = self.start_time.max(start);
        let overlap_end = self.end_time.min(end);
        let duration = overlap_end - overlap_start;
        
        duration.whole_minutes() as f64 + (duration.subsec_milliseconds() as f64 / 60000.0)
    }
}