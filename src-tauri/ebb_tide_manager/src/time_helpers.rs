use time::OffsetDateTime;

/// Get the start of the week (Monday at 00:00:00) for a given time
/// This is used for weekly tide calculations
pub fn get_week_start(time: OffsetDateTime) -> OffsetDateTime {
    let weekday = time.weekday().number_days_from_sunday() as i64;
    let days_since_monday = if weekday == 0 { 6 } else { weekday - 1 };
    
    time.replace_hour(0)
        .unwrap()
        .replace_minute(0)
        .unwrap()
        .replace_second(0)
        .unwrap()
        .replace_nanosecond(0)
        .unwrap()
        - time::Duration::days(days_since_monday)
}

/// Get the start of the month (1st day at 00:00:00) for a given time
/// This is used for monthly tide calculations
pub fn get_month_start(time: OffsetDateTime) -> OffsetDateTime {
    time.replace_day(1)
        .unwrap()
        .replace_hour(0)
        .unwrap()
        .replace_minute(0)
        .unwrap()
        .replace_second(0)
        .unwrap()
        .replace_nanosecond(0)
        .unwrap()
}

/// Get the start of the day (00:00:00) for a given time
/// This is used for daily tide calculations
pub fn get_day_start(time: OffsetDateTime) -> OffsetDateTime {
    time.replace_hour(0)
        .unwrap()
        .replace_minute(0)
        .unwrap()
        .replace_second(0)
        .unwrap()
        .replace_nanosecond(0)
        .unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;
    use time::macros::datetime;

    #[test]
    fn test_get_week_start_monday() {
        // Monday should return the same day at 00:00:00
        let monday = datetime!(2025-01-06 15:30:45 UTC); // Monday afternoon
        let week_start = get_week_start(monday);
        let expected = datetime!(2025-01-06 00:00:00 UTC); // Monday 00:00:00
        assert_eq!(week_start, expected);
    }

    #[test]
    fn test_get_week_start_tuesday() {
        // Tuesday should return previous Monday at 00:00:00
        let tuesday = datetime!(2025-01-07 10:15:30 UTC); // Tuesday morning
        let week_start = get_week_start(tuesday);
        let expected = datetime!(2025-01-06 00:00:00 UTC); // Previous Monday 00:00:00
        assert_eq!(week_start, expected);
    }

    #[test]
    fn test_get_week_start_friday() {
        // Friday should return Monday of the same week at 00:00:00
        let friday = datetime!(2025-01-03 18:45:12 UTC); // Friday evening
        let week_start = get_week_start(friday);
        let expected = datetime!(2024-12-30 00:00:00 UTC); // Monday of that week 00:00:00
        assert_eq!(week_start, expected);
    }

    #[test]
    fn test_get_week_start_sunday() {
        // Sunday should return previous Monday at 00:00:00
        let sunday = datetime!(2025-01-05 12:00:00 UTC); // Sunday noon
        let week_start = get_week_start(sunday);
        let expected = datetime!(2024-12-30 00:00:00 UTC); // Previous Monday 00:00:00
        assert_eq!(week_start, expected);
    }

    #[test]
    fn test_get_week_start_saturday() {
        // Saturday should return Monday of the same week at 00:00:00
        let saturday = datetime!(2025-01-04 08:20:15 UTC); // Saturday morning
        let week_start = get_week_start(saturday);
        let expected = datetime!(2024-12-30 00:00:00 UTC); // Monday of that week 00:00:00
        assert_eq!(week_start, expected);
    }

    #[test]
    fn test_get_week_start_already_midnight() {
        // Test with a time already at midnight
        let wednesday_midnight = datetime!(2025-01-08 00:00:00 UTC); // Wednesday at midnight
        let week_start = get_week_start(wednesday_midnight);
        let expected = datetime!(2025-01-06 00:00:00 UTC); // Monday 00:00:00
        assert_eq!(week_start, expected);
    }

    #[test]
    fn test_get_month_start_first_day() {
        // First day of month should return the same day at 00:00:00
        let first_day = datetime!(2025-01-01 15:30:45 UTC); // January 1st afternoon
        let month_start = get_month_start(first_day);
        let expected = datetime!(2025-01-01 00:00:00 UTC); // January 1st 00:00:00
        assert_eq!(month_start, expected);
    }

    #[test]
    fn test_get_month_start_middle_of_month() {
        // Middle of month should return first day at 00:00:00
        let mid_month = datetime!(2025-01-15 10:25:30 UTC); // January 15th morning
        let month_start = get_month_start(mid_month);
        let expected = datetime!(2025-01-01 00:00:00 UTC); // January 1st 00:00:00
        assert_eq!(month_start, expected);
    }

    #[test]
    fn test_get_month_start_end_of_month() {
        // End of month should return first day at 00:00:00
        let end_month = datetime!(2025-01-31 23:59:59 UTC); // January 31st end of day
        let month_start = get_month_start(end_month);
        let expected = datetime!(2025-01-01 00:00:00 UTC); // January 1st 00:00:00
        assert_eq!(month_start, expected);
    }

    #[test]
    fn test_get_month_start_february() {
        // Test with February (shorter month)
        let february = datetime!(2025-02-20 14:45:12 UTC); // February 20th
        let month_start = get_month_start(february);
        let expected = datetime!(2025-02-01 00:00:00 UTC); // February 1st 00:00:00
        assert_eq!(month_start, expected);
    }

    #[test]
    fn test_get_month_start_december() {
        // Test with December (end of year)
        let december = datetime!(2025-12-25 08:15:30 UTC); // December 25th
        let month_start = get_month_start(december);
        let expected = datetime!(2025-12-01 00:00:00 UTC); // December 1st 00:00:00
        assert_eq!(month_start, expected);
    }

    #[test]
    fn test_get_month_start_already_first_midnight() {
        // Test with a time already at first of month at midnight
        let first_midnight = datetime!(2025-06-01 00:00:00 UTC); // June 1st at midnight
        let month_start = get_month_start(first_midnight);
        let expected = datetime!(2025-06-01 00:00:00 UTC); // June 1st 00:00:00
        assert_eq!(month_start, expected);
    }

    #[test]
    fn test_get_day_start_morning() {
        // Morning time should return same day at 00:00:00
        let morning = datetime!(2025-01-15 08:30:45 UTC); // January 15th morning
        let day_start = get_day_start(morning);
        let expected = datetime!(2025-01-15 00:00:00 UTC); // January 15th 00:00:00
        assert_eq!(day_start, expected);
    }

    #[test]
    fn test_get_day_start_afternoon() {
        // Afternoon time should return same day at 00:00:00
        let afternoon = datetime!(2025-01-15 14:25:12 UTC); // January 15th afternoon
        let day_start = get_day_start(afternoon);
        let expected = datetime!(2025-01-15 00:00:00 UTC); // January 15th 00:00:00
        assert_eq!(day_start, expected);
    }

    #[test]
    fn test_get_day_start_evening() {
        // Evening time should return same day at 00:00:00
        let evening = datetime!(2025-01-15 21:45:30 UTC); // January 15th evening
        let day_start = get_day_start(evening);
        let expected = datetime!(2025-01-15 00:00:00 UTC); // January 15th 00:00:00
        assert_eq!(day_start, expected);
    }

    #[test]
    fn test_get_day_start_end_of_day() {
        // End of day should return same day at 00:00:00
        let end_of_day = datetime!(2025-01-15 23:59:59 UTC); // January 15th end of day
        let day_start = get_day_start(end_of_day);
        let expected = datetime!(2025-01-15 00:00:00 UTC); // January 15th 00:00:00
        assert_eq!(day_start, expected);
    }

    #[test]
    fn test_get_day_start_already_midnight() {
        // Time already at midnight should return same time
        let midnight = datetime!(2025-01-15 00:00:00 UTC); // January 15th at midnight
        let day_start = get_day_start(midnight);
        let expected = datetime!(2025-01-15 00:00:00 UTC); // January 15th 00:00:00
        assert_eq!(day_start, expected);
    }

    #[test]
    fn test_get_day_start_with_microseconds() {
        // Time with microseconds should be normalized to 00:00:00
        let precise_time = datetime!(2025-01-15 12:34:56.789123 UTC); // January 15th with microseconds
        let day_start = get_day_start(precise_time);
        let expected = datetime!(2025-01-15 00:00:00 UTC); // January 15th 00:00:00
        assert_eq!(day_start, expected);
    }

    #[test]
    fn test_get_day_start_leap_year() {
        // Test with leap year date (February 29th)
        let leap_day = datetime!(2024-02-29 16:20:10 UTC); // February 29th (leap year)
        let day_start = get_day_start(leap_day);
        let expected = datetime!(2024-02-29 00:00:00 UTC); // February 29th 00:00:00
        assert_eq!(day_start, expected);
    }
}