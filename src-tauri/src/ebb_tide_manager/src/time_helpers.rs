use time::OffsetDateTime;

/// Get the start of the week (Monday at 00:00:00) for a given time in the system's local timezone
/// This is used for weekly tide calculations
pub fn get_week_start(time: OffsetDateTime) -> OffsetDateTime {
    // Get system's local offset
    let local_offset = time::UtcOffset::current_local_offset()
        .unwrap_or(time::UtcOffset::UTC);

    // Convert to local timezone
    let local_time = time.to_offset(local_offset);

    let weekday = local_time.weekday().number_days_from_sunday() as i64;
    let days_since_monday = if weekday == 0 { 6 } else { weekday - 1 };

    local_time.replace_hour(0)
        .unwrap()
        .replace_minute(0)
        .unwrap()
        .replace_second(0)
        .unwrap()
        .replace_nanosecond(0)
        .unwrap()
        - time::Duration::days(days_since_monday)
}

/// Get the start of the month (1st day at 00:00:00) for a given time in the system's local timezone
/// This is used for monthly tide calculations
pub fn get_month_start(time: OffsetDateTime) -> OffsetDateTime {
    // Get system's local offset
    let local_offset = time::UtcOffset::current_local_offset()
        .unwrap_or(time::UtcOffset::UTC);

    // Convert to local timezone
    let local_time = time.to_offset(local_offset);

    local_time.replace_day(1)
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

/// Get the start of the day (00:00:00) for a given time in the system's local timezone
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

    start_of_day_local
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

        // Verify it's the same date and at start of day
        assert_eq!(week_start.hour(), 0);
        assert_eq!(week_start.minute(), 0);
        assert_eq!(week_start.second(), 0);
        assert_eq!(week_start.nanosecond(), 0);

        // Convert to UTC for date comparison to avoid timezone issues
        let week_start_utc = week_start.to_offset(time::UtcOffset::UTC);
        // Should be Monday (or Sunday if timezone shifted it back a day)
        let weekday = week_start_utc.weekday();
        assert!(weekday == time::Weekday::Monday || weekday == time::Weekday::Sunday);
    }

    #[test]
    fn test_get_week_start_tuesday() {
        // Tuesday should return previous Monday at 00:00:00 in local time
        let tuesday = datetime!(2025-01-07 10:15:30 UTC); // Tuesday morning
        let week_start = get_week_start(tuesday);

        // Verify it's at start of day
        assert_eq!(week_start.hour(), 0);
        assert_eq!(week_start.minute(), 0);
        assert_eq!(week_start.second(), 0);
        assert_eq!(week_start.nanosecond(), 0);

        // Verify it's Monday when converted to same timezone
        let weekday = week_start.weekday();
        assert_eq!(weekday, time::Weekday::Monday);
    }

    #[test]
    fn test_get_week_start_friday() {
        // Friday should return Monday of the same week at 00:00:00 in local time
        let friday = datetime!(2025-01-03 18:45:12 UTC); // Friday evening
        let week_start = get_week_start(friday);

        // Verify it's at start of day
        assert_eq!(week_start.hour(), 0);
        assert_eq!(week_start.minute(), 0);
        assert_eq!(week_start.second(), 0);
        assert_eq!(week_start.nanosecond(), 0);

        // Verify it's Monday
        let weekday = week_start.weekday();
        assert_eq!(weekday, time::Weekday::Monday);
    }

    #[test]
    fn test_get_week_start_sunday() {
        // Sunday should return previous Monday at 00:00:00 in local time
        let sunday = datetime!(2025-01-05 12:00:00 UTC); // Sunday noon
        let week_start = get_week_start(sunday);

        // Verify it's at start of day
        assert_eq!(week_start.hour(), 0);
        assert_eq!(week_start.minute(), 0);
        assert_eq!(week_start.second(), 0);
        assert_eq!(week_start.nanosecond(), 0);

        // Verify it's Monday
        let weekday = week_start.weekday();
        assert_eq!(weekday, time::Weekday::Monday);
    }

    #[test]
    fn test_get_week_start_saturday() {
        // Saturday should return Monday of the same week at 00:00:00 in local time
        let saturday = datetime!(2025-01-04 08:20:15 UTC); // Saturday morning
        let week_start = get_week_start(saturday);

        // Verify it's at start of day
        assert_eq!(week_start.hour(), 0);
        assert_eq!(week_start.minute(), 0);
        assert_eq!(week_start.second(), 0);
        assert_eq!(week_start.nanosecond(), 0);

        // Verify it's Monday
        let weekday = week_start.weekday();
        assert_eq!(weekday, time::Weekday::Monday);
    }

    #[test]
    fn test_get_week_start_already_midnight() {
        // Test with a time already at midnight
        let wednesday_midnight = datetime!(2025-01-08 00:00:00 UTC); // Wednesday at midnight
        let week_start = get_week_start(wednesday_midnight);

        // Verify it's at start of day
        assert_eq!(week_start.hour(), 0);
        assert_eq!(week_start.minute(), 0);
        assert_eq!(week_start.second(), 0);
        assert_eq!(week_start.nanosecond(), 0);

        // Verify it's Monday
        let weekday = week_start.weekday();
        assert_eq!(weekday, time::Weekday::Monday);
    }

    #[test]
    fn test_get_month_start_first_day() {
        // First day of month should return the same day at 00:00:00 in local time
        let first_day = datetime!(2025-01-01 15:30:45 UTC); // January 1st afternoon
        let month_start = get_month_start(first_day);

        // Verify it's at start of day
        assert_eq!(month_start.hour(), 0);
        assert_eq!(month_start.minute(), 0);
        assert_eq!(month_start.second(), 0);
        assert_eq!(month_start.nanosecond(), 0);

        // Verify it's the first day of the month
        assert_eq!(month_start.day(), 1);

        // Verify it's the same month when converted to same timezone
        let first_day_local = first_day.to_offset(month_start.offset());
        assert_eq!(month_start.month(), first_day_local.month());
        assert_eq!(month_start.year(), first_day_local.year());
    }

    #[test]
    fn test_get_month_start_middle_of_month() {
        // Middle of month should return first day at 00:00:00 in local time
        let mid_month = datetime!(2025-01-15 10:25:30 UTC); // January 15th morning
        let month_start = get_month_start(mid_month);

        // Verify it's at start of day
        assert_eq!(month_start.hour(), 0);
        assert_eq!(month_start.minute(), 0);
        assert_eq!(month_start.second(), 0);
        assert_eq!(month_start.nanosecond(), 0);

        // Verify it's the first day of the month
        assert_eq!(month_start.day(), 1);

        // Verify it's the same month when converted to same timezone
        let mid_month_local = mid_month.to_offset(month_start.offset());
        assert_eq!(month_start.month(), mid_month_local.month());
        assert_eq!(month_start.year(), mid_month_local.year());
    }

    #[test]
    fn test_get_month_start_end_of_month() {
        // End of month should return first day at 00:00:00 in local time
        let end_month = datetime!(2025-01-31 23:59:59 UTC); // January 31st end of day
        let month_start = get_month_start(end_month);

        // Verify it's at start of day
        assert_eq!(month_start.hour(), 0);
        assert_eq!(month_start.minute(), 0);
        assert_eq!(month_start.second(), 0);
        assert_eq!(month_start.nanosecond(), 0);

        // Verify it's the first day of the month
        assert_eq!(month_start.day(), 1);

        // Verify it's the same month when converted to same timezone
        let end_month_local = end_month.to_offset(month_start.offset());
        assert_eq!(month_start.month(), end_month_local.month());
        assert_eq!(month_start.year(), end_month_local.year());
    }

    #[test]
    fn test_get_month_start_february() {
        // Test with February (shorter month)
        let february = datetime!(2025-02-20 14:45:12 UTC); // February 20th
        let month_start = get_month_start(february);

        // Verify it's at start of day
        assert_eq!(month_start.hour(), 0);
        assert_eq!(month_start.minute(), 0);
        assert_eq!(month_start.second(), 0);
        assert_eq!(month_start.nanosecond(), 0);

        // Verify it's the first day of the month
        assert_eq!(month_start.day(), 1);

        // Verify it's February when converted to same timezone
        let february_local = february.to_offset(month_start.offset());
        assert_eq!(month_start.month(), february_local.month());
        assert_eq!(month_start.year(), february_local.year());
    }

    #[test]
    fn test_get_month_start_december() {
        // Test with December (end of year)
        let december = datetime!(2025-12-25 08:15:30 UTC); // December 25th
        let month_start = get_month_start(december);

        // Verify it's at start of day
        assert_eq!(month_start.hour(), 0);
        assert_eq!(month_start.minute(), 0);
        assert_eq!(month_start.second(), 0);
        assert_eq!(month_start.nanosecond(), 0);

        // Verify it's the first day of the month
        assert_eq!(month_start.day(), 1);

        // Verify it's December when converted to same timezone
        let december_local = december.to_offset(month_start.offset());
        assert_eq!(month_start.month(), december_local.month());
        assert_eq!(month_start.year(), december_local.year());
    }

    #[test]
    fn test_get_month_start_already_first_midnight() {
        // Test with a time already at first of month at midnight
        let first_midnight = datetime!(2025-06-01 00:00:00 UTC); // June 1st at midnight
        let month_start = get_month_start(first_midnight);

        // Verify it's at start of day
        assert_eq!(month_start.hour(), 0);
        assert_eq!(month_start.minute(), 0);
        assert_eq!(month_start.second(), 0);
        assert_eq!(month_start.nanosecond(), 0);

        // Verify it's the first day of the month
        assert_eq!(month_start.day(), 1);

        // Verify it's June when converted to same timezone
        let first_midnight_local = first_midnight.to_offset(month_start.offset());
        assert_eq!(month_start.month(), first_midnight_local.month());
        assert_eq!(month_start.year(), first_midnight_local.year());
    }

    #[test]
    fn test_get_day_start_morning() {
        // Morning time should return same day at 00:00:00
        let morning = datetime!(2025-01-15 08:30:45 UTC); // January 15th morning
        let day_start = get_day_start(morning);

        // Verify it's at start of day
        assert_eq!(day_start.hour(), 0);
        assert_eq!(day_start.minute(), 0);
        assert_eq!(day_start.second(), 0);
        assert_eq!(day_start.nanosecond(), 0);

        // Verify it's the same day (when converted to same timezone)
        let morning_local = morning.to_offset(day_start.offset());
        assert_eq!(day_start.date(), morning_local.date());
    }

    #[test]
    fn test_get_day_start_afternoon() {
        // Afternoon time should return same day at 00:00:00 in local time
        let afternoon = datetime!(2025-01-15 14:25:12 UTC); // January 15th afternoon
        let day_start = get_day_start(afternoon);

        // Verify it's at start of day
        assert_eq!(day_start.hour(), 0);
        assert_eq!(day_start.minute(), 0);
        assert_eq!(day_start.second(), 0);
        assert_eq!(day_start.nanosecond(), 0);

        // Verify it's the same day when converted to same timezone
        let afternoon_local = afternoon.to_offset(day_start.offset());
        assert_eq!(day_start.date(), afternoon_local.date());
    }

    #[test]
    fn test_get_day_start_evening() {
        // Evening time should return same day at 00:00:00 in local time
        let evening = datetime!(2025-01-15 21:45:30 UTC); // January 15th evening
        let day_start = get_day_start(evening);

        // Verify it's at start of day
        assert_eq!(day_start.hour(), 0);
        assert_eq!(day_start.minute(), 0);
        assert_eq!(day_start.second(), 0);
        assert_eq!(day_start.nanosecond(), 0);

        // Verify it's the same day when converted to same timezone
        let evening_local = evening.to_offset(day_start.offset());
        assert_eq!(day_start.date(), evening_local.date());
    }

    #[test]
    fn test_get_day_start_end_of_day() {
        // End of day should return same day at 00:00:00 in local time
        let end_of_day = datetime!(2025-01-15 23:59:59 UTC); // January 15th end of day
        let day_start = get_day_start(end_of_day);

        // Verify it's at start of day
        assert_eq!(day_start.hour(), 0);
        assert_eq!(day_start.minute(), 0);
        assert_eq!(day_start.second(), 0);
        assert_eq!(day_start.nanosecond(), 0);

        // Verify it's the same day when converted to same timezone
        let end_of_day_local = end_of_day.to_offset(day_start.offset());
        assert_eq!(day_start.date(), end_of_day_local.date());
    }

    #[test]
    fn test_get_day_start_already_midnight() {
        // Time already at midnight should return same time in local time
        let midnight = datetime!(2025-01-15 00:00:00 UTC); // January 15th at midnight
        let day_start = get_day_start(midnight);

        // Verify it's at start of day
        assert_eq!(day_start.hour(), 0);
        assert_eq!(day_start.minute(), 0);
        assert_eq!(day_start.second(), 0);
        assert_eq!(day_start.nanosecond(), 0);

        // Verify it's the same day when converted to same timezone
        let midnight_local = midnight.to_offset(day_start.offset());
        assert_eq!(day_start.date(), midnight_local.date());
    }

    #[test]
    fn test_get_day_start_with_microseconds() {
        // Time with microseconds should be normalized to 00:00:00 in local time
        let precise_time = datetime!(2025-01-15 12:34:56.789123 UTC); // January 15th with microseconds
        let day_start = get_day_start(precise_time);

        // Verify it's at start of day
        assert_eq!(day_start.hour(), 0);
        assert_eq!(day_start.minute(), 0);
        assert_eq!(day_start.second(), 0);
        assert_eq!(day_start.nanosecond(), 0);

        // Verify it's the same day when converted to same timezone
        let precise_time_local = precise_time.to_offset(day_start.offset());
        assert_eq!(day_start.date(), precise_time_local.date());
    }

    #[test]
    fn test_get_day_start_leap_year() {
        // Test with leap year date (February 29th)
        let leap_day = datetime!(2024-02-29 16:20:10 UTC); // February 29th (leap year)
        let day_start = get_day_start(leap_day);

        // Verify it's at start of day
        assert_eq!(day_start.hour(), 0);
        assert_eq!(day_start.minute(), 0);
        assert_eq!(day_start.second(), 0);
        assert_eq!(day_start.nanosecond(), 0);

        // Verify it's the same day when converted to same timezone
        let leap_day_local = leap_day.to_offset(day_start.offset());
        assert_eq!(day_start.date(), leap_day_local.date());
    }
}