use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::OffsetDateTime;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct TideTemplate {
    pub id: String,
    pub metrics_type: String, // "creating", etc.
    pub tide_frequency: String, // "daily", "weekly"
    pub first_tide: OffsetDateTime, // How far back to create tides when generating
    pub day_of_week: Option<String>, // For daily tides: comma-separated days "0,1,2,3,4,5,6" (0=Sunday, 6=Saturday)
    pub goal_amount: f64,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}

impl TideTemplate {
    pub fn new(
        metrics_type: String, 
        tide_frequency: String, 
        goal_amount: f64,
        first_tide: OffsetDateTime,
        day_of_week: Option<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            metrics_type,
            tide_frequency,
            first_tide,
            day_of_week,
            goal_amount,
            created_at: OffsetDateTime::now_utc(),
            updated_at: OffsetDateTime::now_utc(),
        }
    }

    /// Helper method to parse day_of_week string into a Vec<u8>
    pub fn get_days_of_week(&self) -> Vec<u8> {
        match &self.day_of_week {
            Some(days_str) => {
                days_str
                    .split(',')
                    .filter_map(|s| s.trim().parse::<u8>().ok())
                    .filter(|&day| day <= 6) // Only allow 0-6
                    .collect()
            }
            None => vec![0, 1, 2, 3, 4, 5, 6], // All days if not specified
        }
    }

    /// Helper method to create day_of_week string from Vec<u8>
    pub fn set_days_of_week(days: Vec<u8>) -> Option<String> {
        if days.len() == 7 && days == vec![0, 1, 2, 3, 4, 5, 6] {
            None // All days = None for simplicity
        } else {
            Some(days.iter().map(|d| d.to_string()).collect::<Vec<_>>().join(","))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use time::macros::datetime;

    #[test]
    fn test_new_tide_template() {
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template = TideTemplate::new(
            "creating".to_string(),
            "daily".to_string(),
            100.0,
            first_tide,
            Some("1,2,3,4,5".to_string()), // Weekdays only
        );

        assert_eq!(template.metrics_type, "creating");
        assert_eq!(template.tide_frequency, "daily");
        assert_eq!(template.goal_amount, 100.0);
        assert_eq!(template.first_tide, first_tide);
        assert_eq!(template.day_of_week, Some("1,2,3,4,5".to_string()));
        assert!(!template.id.is_empty());
    }

    #[test]
    fn test_get_days_of_week_with_specific_days() {
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template = TideTemplate::new(
            "creating".to_string(),
            "daily".to_string(),
            100.0,
            first_tide,
            Some("1,3,5".to_string()), // Monday, Wednesday, Friday
        );

        let days = template.get_days_of_week();
        assert_eq!(days, vec![1, 3, 5]);
    }

    #[test]
    fn test_get_days_of_week_all_days() {
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template = TideTemplate::new(
            "creating".to_string(),
            "daily".to_string(),
            100.0,
            first_tide,
            None, // All days
        );

        let days = template.get_days_of_week();
        assert_eq!(days, vec![0, 1, 2, 3, 4, 5, 6]);
    }

    #[test]
    fn test_get_days_of_week_filters_invalid() {
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template = TideTemplate::new(
            "creating".to_string(),
            "daily".to_string(),
            100.0,
            first_tide,
            Some("1,3,8,invalid,5".to_string()), // 8 and "invalid" should be filtered out
        );

        let days = template.get_days_of_week();
        assert_eq!(days, vec![1, 3, 5]);
    }

    #[test]
    fn test_get_days_of_week_empty_string() {
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template = TideTemplate::new(
            "creating".to_string(),
            "daily".to_string(),
            100.0,
            first_tide,
            Some("".to_string()), // Empty string
        );

        let days = template.get_days_of_week();
        assert_eq!(days, Vec::<u8>::new()); // Should return empty vec for empty string
    }

    #[test]
    fn test_set_days_of_week_all_days() {
        let all_days = vec![0, 1, 2, 3, 4, 5, 6];
        let result = TideTemplate::set_days_of_week(all_days);
        assert_eq!(result, None); // Should return None for all days
    }

    #[test]
    fn test_set_days_of_week_specific_days() {
        let weekdays = vec![1, 2, 3, 4, 5];
        let result = TideTemplate::set_days_of_week(weekdays);
        assert_eq!(result, Some("1,2,3,4,5".to_string()));
    }

    #[test]
    fn test_set_days_of_week_single_day() {
        let single_day = vec![0];
        let result = TideTemplate::set_days_of_week(single_day);
        assert_eq!(result, Some("0".to_string()));
    }

    #[test]
    fn test_set_days_of_week_empty() {
        let empty_days = vec![];
        let result = TideTemplate::set_days_of_week(empty_days);
        assert_eq!(result, Some("".to_string()));
    }

    #[test]
    fn test_roundtrip_days_of_week() {
        // Test that we can roundtrip days of week
        let original_days = vec![1, 3, 5, 6];
        let days_string = TideTemplate::set_days_of_week(original_days.clone());
        
        let first_tide = datetime!(2025-01-01 0:00 UTC);
        let template = TideTemplate::new(
            "creating".to_string(),
            "daily".to_string(),
            100.0,
            first_tide,
            days_string,
        );
        
        let parsed_days = template.get_days_of_week();
        assert_eq!(parsed_days, original_days);
    }
}