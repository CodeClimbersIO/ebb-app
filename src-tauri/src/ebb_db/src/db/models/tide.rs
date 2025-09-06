use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::OffsetDateTime;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Tide {
    pub id: String,
    pub start: OffsetDateTime,
    pub end: Option<OffsetDateTime>, // System-generated end time based on frequency/interval (nullable for indefinite tides)
    pub completed_at: Option<OffsetDateTime>, // When the tide was actually completed by the user
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
        end: Option<OffsetDateTime>,
        metrics_type: String,
        tide_frequency: String,
        goal_amount: f64,
        tide_template_id: String,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            start,
            end,
            completed_at: None,
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
        use time::Duration;
        
        // Calculate end time based on tide frequency
        let end = match template.tide_frequency.as_str() {
            "daily" => Some(start + Duration::days(1)),
            "weekly" => Some(start + Duration::days(7)),
            "monthly" => Some(start + Duration::days(30)), // Approximate
            "indefinite" => None, // No end time for indefinite tides
            _ => Some(start + Duration::days(1)), // Default to daily
        };

        Self::new(
            start,
            end,
            template.metrics_type.clone(),
            template.tide_frequency.clone(),
            template.goal_amount,
            template.id.clone(),
        )
    }

    /// Check if the tide is completed (has completed_at set)
    pub fn is_completed(&self) -> bool {
        self.completed_at.is_some()
    }

    /// Check if the tide is active (not completed and within its time window)
    pub fn is_active(&self) -> bool {
        if self.is_completed() {
            return false;
        }

        let now = OffsetDateTime::now_utc();
        match self.end {
            Some(end_time) => now <= end_time,
            None => true, // Indefinite tides are always active until completed
        }
    }

    /// Mark the tide as completed
    pub fn mark_completed(&mut self) {
        self.completed_at = Some(OffsetDateTime::now_utc());
        self.updated_at = OffsetDateTime::now_utc();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::models::tide_template::TideTemplate as TideTemplateModel;
    use time::macros::datetime;
    use time::Duration;

    fn create_test_template() -> TideTemplateModel {
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        TideTemplateModel::new(
            "creating".to_string(),
            "daily".to_string(),
            100.0,
            first_tide,
            None,
        )
    }

    #[test]
    fn test_new_tide() {
        let start = datetime!(2025-01-01 12:00 UTC);
        let end = Some(datetime!(2025-01-02 12:00 UTC));
        let tide = Tide::new(
            start,
            end,
            "creating".to_string(),
            "daily".to_string(),
            100.0,
            "template-id".to_string(),
        );

        assert_eq!(tide.start, start);
        assert_eq!(tide.end, end);
        assert_eq!(tide.completed_at, None);
        assert_eq!(tide.metrics_type, "creating");
        assert_eq!(tide.tide_frequency, "daily");
        assert_eq!(tide.goal_amount, 100.0);
        assert_eq!(tide.actual_amount, 0.0);
        assert_eq!(tide.tide_template_id, "template-id");
        assert!(!tide.id.is_empty());
    }

    #[test]
    fn test_from_template_daily() {
        let template = create_test_template();
        let start = datetime!(2025-01-01 12:00 UTC);
        let tide = Tide::from_template(&template, start);

        assert_eq!(tide.start, start);
        assert_eq!(tide.end, Some(start + Duration::days(1)));
        assert_eq!(tide.completed_at, None);
        assert_eq!(tide.metrics_type, "creating");
        assert_eq!(tide.tide_frequency, "daily");
        assert_eq!(tide.goal_amount, 100.0);
        assert_eq!(tide.tide_template_id, template.id);
    }

    #[test]
    fn test_from_template_weekly() {
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template = TideTemplateModel::new(
            "learning".to_string(),
            "weekly".to_string(),
            500.0,
            first_tide,
            None,
        );
        let start = datetime!(2025-01-01 12:00 UTC);
        let tide = Tide::from_template(&template, start);

        assert_eq!(tide.end, Some(start + Duration::days(7)));
        assert_eq!(tide.tide_frequency, "weekly");
    }

    #[test]
    fn test_from_template_indefinite() {
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template = TideTemplateModel::new(
            "project".to_string(),
            "indefinite".to_string(),
            1000.0,
            first_tide,
            None,
        );
        let start = datetime!(2025-01-01 12:00 UTC);
        let tide = Tide::from_template(&template, start);

        assert_eq!(tide.end, None);
        assert_eq!(tide.tide_frequency, "indefinite");
    }

    #[test]
    fn test_is_completed_false() {
        let template = create_test_template();
        let start = datetime!(2025-01-01 12:00 UTC);
        let tide = Tide::from_template(&template, start);

        assert!(!tide.is_completed());
    }

    #[test]
    fn test_is_completed_true() {
        let template = create_test_template();
        let start = datetime!(2025-01-01 12:00 UTC);
        let mut tide = Tide::from_template(&template, start);
        tide.mark_completed();

        assert!(tide.is_completed());
    }

    #[test]
    fn test_is_active_not_completed_within_window() {
        let template = create_test_template();
        let start = OffsetDateTime::now_utc() - Duration::hours(12); // Started 12 hours ago
        let tide = Tide::from_template(&template, start);

        // Should be active since it's not completed and within 24 hour window
        assert!(tide.is_active());
    }

    #[test]
    fn test_is_active_completed() {
        let template = create_test_template();
        let start = OffsetDateTime::now_utc() - Duration::hours(12);
        let mut tide = Tide::from_template(&template, start);
        tide.mark_completed();

        // Should not be active since it's completed
        assert!(!tide.is_active());
    }

    #[test]
    fn test_is_active_past_end_time() {
        let template = create_test_template();
        let start = OffsetDateTime::now_utc() - Duration::days(2); // Started 2 days ago
        let tide = Tide::from_template(&template, start);

        // Should not be active since it's past the end time (daily = 1 day)
        assert!(!tide.is_active());
    }

    #[test]
    fn test_is_active_indefinite() {
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template = TideTemplateModel::new(
            "project".to_string(),
            "indefinite".to_string(),
            1000.0,
            first_tide,
            None,
        );
        let start = OffsetDateTime::now_utc() - Duration::days(30); // Started 30 days ago
        let tide = Tide::from_template(&template, start);

        // Should be active since indefinite tides have no end time
        assert!(tide.is_active());
    }

    #[test]
    fn test_mark_completed() {
        let template = create_test_template();
        let start = datetime!(2025-01-01 12:00 UTC);
        let mut tide = Tide::from_template(&template, start);
        let original_updated_at = tide.updated_at;

        assert_eq!(tide.completed_at, None);
        
        // Add a small delay to ensure timestamp difference
        std::thread::sleep(std::time::Duration::from_millis(1));
        
        tide.mark_completed();
        
        assert!(tide.completed_at.is_some());
        assert!(tide.updated_at >= original_updated_at);
        assert!(tide.is_completed());
    }
}