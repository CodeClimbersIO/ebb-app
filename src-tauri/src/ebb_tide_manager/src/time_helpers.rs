use time::OffsetDateTime;

/// Get the start of the week (Monday at 00:00:00) for a given time in the system's local timezone
/// Returns the result as UTC time (representing local midnight converted to UTC)
/// This is used for weekly tide calculations
pub fn get_week_start(time: OffsetDateTime) -> OffsetDateTime {
    // Get system's local offset
    let local_offset = time::UtcOffset::current_local_offset()
        .unwrap_or(time::UtcOffset::UTC);

    // Convert to local timezone
    let local_time = time.to_offset(local_offset);

    let weekday = local_time.weekday().number_days_from_sunday() as i64;
    let days_since_monday = if weekday == 0 { 6 } else { weekday - 1 };

    let start_of_week_local = local_time.replace_hour(0)
        .unwrap()
        .replace_minute(0)
        .unwrap()
        .replace_second(0)
        .unwrap()
        .replace_nanosecond(0)
        .unwrap()
        - time::Duration::days(days_since_monday);

    // Convert back to UTC for storage
    start_of_week_local.to_offset(time::UtcOffset::UTC)
}

/// Get the start of the month (1st day at 00:00:00) for a given time in the system's local timezone
/// Returns the result as UTC time (representing local midnight converted to UTC)
/// This is used for monthly tide calculations
pub fn get_month_start(time: OffsetDateTime) -> OffsetDateTime {
    // Get system's local offset
    let local_offset = time::UtcOffset::current_local_offset()
        .unwrap_or(time::UtcOffset::UTC);

    // Convert to local timezone
    let local_time = time.to_offset(local_offset);

    let start_of_month_local = local_time.replace_day(1)
        .unwrap()
        .replace_hour(0)
        .unwrap()
        .replace_minute(0)
        .unwrap()
        .replace_second(0)
        .unwrap()
        .replace_nanosecond(0)
        .unwrap();

    // Convert back to UTC for storage
    start_of_month_local.to_offset(time::UtcOffset::UTC)
}

/// Get the start of the day (00:00:00) for a given time in the system's local timezone
/// Returns the result as UTC time (representing local midnight converted to UTC)
/// This is used for daily tide calculations
pub fn get_day_start(time: OffsetDateTime) -> OffsetDateTime {
    // Get system's local offset
    let local_offset = time::UtcOffset::current_local_offset()
        .unwrap_or(time::UtcOffset::UTC); // Fallback to UTC if local offset unavailable

    // Convert to local timezone
    let local_time = time.to_offset(local_offset);

    // Get start of day in local timezone
    let start_of_day_local = local_time
        .replace_hour(0)
        .unwrap()
        .replace_minute(0)
        .unwrap()
        .replace_second(0)
        .unwrap()
        .replace_nanosecond(0)
        .unwrap();

    // Convert back to UTC for storage
    start_of_day_local.to_offset(time::UtcOffset::UTC)
}

#[cfg(test)]
mod tests {
    use super::*;
    use time::macros::datetime;

    #[test]
    fn test_get_week_start_monday() {
        // Monday should return the same day at 00:00:00 in local time, returned as UTC
        let monday = datetime!(2025-01-06 15:30:45 UTC); // Monday afternoon
        let week_start = get_week_start(monday);

        assert_eq!(week_start.offset(), time::UtcOffset::UTC);
        let local_offset = time::UtcOffset::current_local_offset().unwrap_or(time::UtcOffset::UTC);
        let week_start_local = week_start.to_offset(local_offset);

        assert_eq!(week_start_local.hour(), 0);
        assert_eq!(week_start_local.minute(), 0);
        assert_eq!(week_start_local.second(), 0);
        assert_eq!(week_start_local.nanosecond(), 0);
        assert_eq!(week_start_local.weekday(), time::Weekday::Monday);
    }

    #[test]
    fn test_get_week_start_tuesday() {
        // Tuesday should return previous Monday at 00:00:00 in local time, returned as UTC
        let tuesday = datetime!(2025-01-07 10:15:30 UTC); // Tuesday morning
        let week_start = get_week_start(tuesday);

        assert_eq!(week_start.offset(), time::UtcOffset::UTC);
        let local_offset = time::UtcOffset::current_local_offset().unwrap_or(time::UtcOffset::UTC);
        let week_start_local = week_start.to_offset(local_offset);

        assert_eq!(week_start_local.hour(), 0);
        assert_eq!(week_start_local.minute(), 0);
        assert_eq!(week_start_local.second(), 0);
        assert_eq!(week_start_local.nanosecond(), 0);
        assert_eq!(week_start_local.weekday(), time::Weekday::Monday);
    }

    #[test]
    fn test_get_week_start_friday() {
        // Friday should return Monday of the same week at 00:00:00 in local time, returned as UTC
        let friday = datetime!(2025-01-03 18:45:12 UTC); // Friday evening
        let week_start = get_week_start(friday);

        assert_eq!(week_start.offset(), time::UtcOffset::UTC);
        let local_offset = time::UtcOffset::current_local_offset().unwrap_or(time::UtcOffset::UTC);
        let week_start_local = week_start.to_offset(local_offset);

        assert_eq!(week_start_local.hour(), 0);
        assert_eq!(week_start_local.minute(), 0);
        assert_eq!(week_start_local.second(), 0);
        assert_eq!(week_start_local.nanosecond(), 0);
        assert_eq!(week_start_local.weekday(), time::Weekday::Monday);
    }

    #[test]
    fn test_get_week_start_sunday() {
        // Sunday should return previous Monday at 00:00:00 in local time, returned as UTC
        let sunday = datetime!(2025-01-05 12:00:00 UTC); // Sunday noon
        let week_start = get_week_start(sunday);

        assert_eq!(week_start.offset(), time::UtcOffset::UTC);
        let local_offset = time::UtcOffset::current_local_offset().unwrap_or(time::UtcOffset::UTC);
        let week_start_local = week_start.to_offset(local_offset);

        assert_eq!(week_start_local.hour(), 0);
        assert_eq!(week_start_local.minute(), 0);
        assert_eq!(week_start_local.second(), 0);
        assert_eq!(week_start_local.nanosecond(), 0);
        assert_eq!(week_start_local.weekday(), time::Weekday::Monday);
    }

    #[test]
    fn test_get_week_start_saturday() {
        // Saturday should return Monday of the same week at 00:00:00 in local time, returned as UTC
        let saturday = datetime!(2025-01-04 08:20:15 UTC); // Saturday morning
        let week_start = get_week_start(saturday);

        assert_eq!(week_start.offset(), time::UtcOffset::UTC);
        let local_offset = time::UtcOffset::current_local_offset().unwrap_or(time::UtcOffset::UTC);
        let week_start_local = week_start.to_offset(local_offset);

        assert_eq!(week_start_local.hour(), 0);
        assert_eq!(week_start_local.minute(), 0);
        assert_eq!(week_start_local.second(), 0);
        assert_eq!(week_start_local.nanosecond(), 0);
        assert_eq!(week_start_local.weekday(), time::Weekday::Monday);
    }

    #[test]
    fn test_get_week_start_already_midnight() {
        // Test with a time already at midnight
        let wednesday_midnight = datetime!(2025-01-08 00:00:00 UTC); // Wednesday at midnight
        let week_start = get_week_start(wednesday_midnight);

        assert_eq!(week_start.offset(), time::UtcOffset::UTC);
        let local_offset = time::UtcOffset::current_local_offset().unwrap_or(time::UtcOffset::UTC);
        let week_start_local = week_start.to_offset(local_offset);

        assert_eq!(week_start_local.hour(), 0);
        assert_eq!(week_start_local.minute(), 0);
        assert_eq!(week_start_local.second(), 0);
        assert_eq!(week_start_local.nanosecond(), 0);
        assert_eq!(week_start_local.weekday(), time::Weekday::Monday);
    }

    #[test]
    fn test_get_month_start_first_day() {
        // First day of month should return the same day at 00:00:00 in local time, returned as UTC
        let first_day = datetime!(2025-01-01 15:30:45 UTC); // January 1st afternoon
        let month_start = get_month_start(first_day);

        assert_eq!(month_start.offset(), time::UtcOffset::UTC);
        let local_offset = time::UtcOffset::current_local_offset().unwrap_or(time::UtcOffset::UTC);
        let month_start_local = month_start.to_offset(local_offset);
        let first_day_local = first_day.to_offset(local_offset);

        assert_eq!(month_start_local.hour(), 0);
        assert_eq!(month_start_local.minute(), 0);
        assert_eq!(month_start_local.second(), 0);
        assert_eq!(month_start_local.nanosecond(), 0);
        assert_eq!(month_start_local.day(), 1);
        assert_eq!(month_start_local.month(), first_day_local.month());
        assert_eq!(month_start_local.year(), first_day_local.year());
    }

    #[test]
    fn test_get_month_start_middle_of_month() {
        // Middle of month should return first day at 00:00:00 in local time, returned as UTC
        let mid_month = datetime!(2025-01-15 10:25:30 UTC); // January 15th morning
        let month_start = get_month_start(mid_month);

        assert_eq!(month_start.offset(), time::UtcOffset::UTC);
        let local_offset = time::UtcOffset::current_local_offset().unwrap_or(time::UtcOffset::UTC);
        let month_start_local = month_start.to_offset(local_offset);
        let mid_month_local = mid_month.to_offset(local_offset);

        assert_eq!(month_start_local.hour(), 0);
        assert_eq!(month_start_local.minute(), 0);
        assert_eq!(month_start_local.second(), 0);
        assert_eq!(month_start_local.nanosecond(), 0);
        assert_eq!(month_start_local.day(), 1);
        assert_eq!(month_start_local.month(), mid_month_local.month());
        assert_eq!(month_start_local.year(), mid_month_local.year());
    }

    #[test]
    fn test_get_month_start_end_of_month() {
        // End of month should return first day at 00:00:00 in local time, returned as UTC
        let end_month = datetime!(2025-01-31 23:59:59 UTC); // January 31st end of day
        let month_start = get_month_start(end_month);

        assert_eq!(month_start.offset(), time::UtcOffset::UTC);
        let local_offset = time::UtcOffset::current_local_offset().unwrap_or(time::UtcOffset::UTC);
        let month_start_local = month_start.to_offset(local_offset);
        let end_month_local = end_month.to_offset(local_offset);

        assert_eq!(month_start_local.hour(), 0);
        assert_eq!(month_start_local.minute(), 0);
        assert_eq!(month_start_local.second(), 0);
        assert_eq!(month_start_local.nanosecond(), 0);
        assert_eq!(month_start_local.day(), 1);
        assert_eq!(month_start_local.month(), end_month_local.month());
        assert_eq!(month_start_local.year(), end_month_local.year());
    }

    #[test]
    fn test_get_month_start_february() {
        // Test with February (shorter month)
        let february = datetime!(2025-02-20 14:45:12 UTC); // February 20th
        let month_start = get_month_start(february);

        assert_eq!(month_start.offset(), time::UtcOffset::UTC);
        let local_offset = time::UtcOffset::current_local_offset().unwrap_or(time::UtcOffset::UTC);
        let month_start_local = month_start.to_offset(local_offset);
        let february_local = february.to_offset(local_offset);

        assert_eq!(month_start_local.hour(), 0);
        assert_eq!(month_start_local.minute(), 0);
        assert_eq!(month_start_local.second(), 0);
        assert_eq!(month_start_local.nanosecond(), 0);
        assert_eq!(month_start_local.day(), 1);
        assert_eq!(month_start_local.month(), february_local.month());
        assert_eq!(month_start_local.year(), february_local.year());
    }

    #[test]
    fn test_get_month_start_december() {
        // Test with December (end of year)
        let december = datetime!(2025-12-25 08:15:30 UTC); // December 25th
        let month_start = get_month_start(december);

        assert_eq!(month_start.offset(), time::UtcOffset::UTC);
        let local_offset = time::UtcOffset::current_local_offset().unwrap_or(time::UtcOffset::UTC);
        let month_start_local = month_start.to_offset(local_offset);
        let december_local = december.to_offset(local_offset);

        assert_eq!(month_start_local.hour(), 0);
        assert_eq!(month_start_local.minute(), 0);
        assert_eq!(month_start_local.second(), 0);
        assert_eq!(month_start_local.nanosecond(), 0);
        assert_eq!(month_start_local.day(), 1);
        assert_eq!(month_start_local.month(), december_local.month());
        assert_eq!(month_start_local.year(), december_local.year());
    }

    #[test]
    fn test_get_month_start_already_first_midnight() {
        // Test with a time already at first of month at midnight
        let first_midnight = datetime!(2025-06-01 00:00:00 UTC); // June 1st at midnight
        let month_start = get_month_start(first_midnight);

        assert_eq!(month_start.offset(), time::UtcOffset::UTC);
        let local_offset = time::UtcOffset::current_local_offset().unwrap_or(time::UtcOffset::UTC);
        let month_start_local = month_start.to_offset(local_offset);
        let first_midnight_local = first_midnight.to_offset(local_offset);

        assert_eq!(month_start_local.hour(), 0);
        assert_eq!(month_start_local.minute(), 0);
        assert_eq!(month_start_local.second(), 0);
        assert_eq!(month_start_local.nanosecond(), 0);
        assert_eq!(month_start_local.day(), 1);
        assert_eq!(month_start_local.month(), first_midnight_local.month());
        assert_eq!(month_start_local.year(), first_midnight_local.year());
    }

    #[test]
    fn test_get_day_start_morning() {
        // Morning time should return same day at 00:00:00 in local time, returned as UTC
        let morning = datetime!(2025-01-15 08:30:45 UTC); // January 15th morning
        let day_start = get_day_start(morning);

        // Result should be in UTC
        assert_eq!(day_start.offset(), time::UtcOffset::UTC);

        // When converted to local time, should be at midnight
        let local_offset = time::UtcOffset::current_local_offset()
            .unwrap_or(time::UtcOffset::UTC);
        let day_start_local = day_start.to_offset(local_offset);

        assert_eq!(day_start_local.hour(), 0);
        assert_eq!(day_start_local.minute(), 0);
        assert_eq!(day_start_local.second(), 0);
        assert_eq!(day_start_local.nanosecond(), 0);

        // Verify it's the same day in local timezone
        let morning_local = morning.to_offset(local_offset);
        assert_eq!(day_start_local.date(), morning_local.date());
    }

    #[test]
    fn test_get_day_start_afternoon() {
        // Afternoon time should return same day at 00:00:00 in local time, returned as UTC
        let afternoon = datetime!(2025-01-15 14:25:12 UTC); // January 15th afternoon
        let day_start = get_day_start(afternoon);

        // Result should be in UTC
        assert_eq!(day_start.offset(), time::UtcOffset::UTC);

        // When converted to local time, should be at midnight
        let local_offset = time::UtcOffset::current_local_offset()
            .unwrap_or(time::UtcOffset::UTC);
        let day_start_local = day_start.to_offset(local_offset);

        assert_eq!(day_start_local.hour(), 0);
        assert_eq!(day_start_local.minute(), 0);
        assert_eq!(day_start_local.second(), 0);
        assert_eq!(day_start_local.nanosecond(), 0);

        // Verify it's the same day in local timezone
        let afternoon_local = afternoon.to_offset(local_offset);
        assert_eq!(day_start_local.date(), afternoon_local.date());
    }

    #[test]
    fn test_get_day_start_evening() {
        // Evening time should return same day at 00:00:00 in local time, returned as UTC
        let evening = datetime!(2025-01-15 21:45:30 UTC); // January 15th evening
        let day_start = get_day_start(evening);

        assert_eq!(day_start.offset(), time::UtcOffset::UTC);
        let local_offset = time::UtcOffset::current_local_offset().unwrap_or(time::UtcOffset::UTC);
        let day_start_local = day_start.to_offset(local_offset);

        assert_eq!(day_start_local.hour(), 0);
        assert_eq!(day_start_local.minute(), 0);
        assert_eq!(day_start_local.second(), 0);
        assert_eq!(day_start_local.nanosecond(), 0);

        let evening_local = evening.to_offset(local_offset);
        assert_eq!(day_start_local.date(), evening_local.date());
    }

    #[test]
    fn test_get_day_start_end_of_day() {
        // End of day should return same day at 00:00:00 in local time, returned as UTC
        let end_of_day = datetime!(2025-01-15 23:59:59 UTC); // January 15th end of day
        let day_start = get_day_start(end_of_day);

        assert_eq!(day_start.offset(), time::UtcOffset::UTC);
        let local_offset = time::UtcOffset::current_local_offset().unwrap_or(time::UtcOffset::UTC);
        let day_start_local = day_start.to_offset(local_offset);

        assert_eq!(day_start_local.hour(), 0);
        assert_eq!(day_start_local.minute(), 0);
        assert_eq!(day_start_local.second(), 0);
        assert_eq!(day_start_local.nanosecond(), 0);

        let end_of_day_local = end_of_day.to_offset(local_offset);
        assert_eq!(day_start_local.date(), end_of_day_local.date());
    }

    #[test]
    fn test_get_day_start_already_midnight() {
        // Time already at midnight should return same time in local time, returned as UTC
        let midnight = datetime!(2025-01-15 00:00:00 UTC); // January 15th at midnight
        let day_start = get_day_start(midnight);

        assert_eq!(day_start.offset(), time::UtcOffset::UTC);
        let local_offset = time::UtcOffset::current_local_offset().unwrap_or(time::UtcOffset::UTC);
        let day_start_local = day_start.to_offset(local_offset);

        assert_eq!(day_start_local.hour(), 0);
        assert_eq!(day_start_local.minute(), 0);
        assert_eq!(day_start_local.second(), 0);
        assert_eq!(day_start_local.nanosecond(), 0);

        let midnight_local = midnight.to_offset(local_offset);
        assert_eq!(day_start_local.date(), midnight_local.date());
    }

    #[test]
    fn test_get_day_start_with_microseconds() {
        // Time with microseconds should be normalized to 00:00:00 in local time, returned as UTC
        let precise_time = datetime!(2025-01-15 12:34:56.789123 UTC); // January 15th with microseconds
        let day_start = get_day_start(precise_time);

        assert_eq!(day_start.offset(), time::UtcOffset::UTC);
        let local_offset = time::UtcOffset::current_local_offset().unwrap_or(time::UtcOffset::UTC);
        let day_start_local = day_start.to_offset(local_offset);

        assert_eq!(day_start_local.hour(), 0);
        assert_eq!(day_start_local.minute(), 0);
        assert_eq!(day_start_local.second(), 0);
        assert_eq!(day_start_local.nanosecond(), 0);

        let precise_time_local = precise_time.to_offset(local_offset);
        assert_eq!(day_start_local.date(), precise_time_local.date());
    }

    #[test]
    fn test_get_day_start_leap_year() {
        // Test with leap year date (February 29th)
        let leap_day = datetime!(2024-02-29 16:20:10 UTC); // February 29th (leap year)
        let day_start = get_day_start(leap_day);

        assert_eq!(day_start.offset(), time::UtcOffset::UTC);
        let local_offset = time::UtcOffset::current_local_offset().unwrap_or(time::UtcOffset::UTC);
        let day_start_local = day_start.to_offset(local_offset);

        assert_eq!(day_start_local.hour(), 0);
        assert_eq!(day_start_local.minute(), 0);
        assert_eq!(day_start_local.second(), 0);
        assert_eq!(day_start_local.nanosecond(), 0);

        let leap_day_local = leap_day.to_offset(local_offset);
        assert_eq!(day_start_local.date(), leap_day_local.date());
    }
}