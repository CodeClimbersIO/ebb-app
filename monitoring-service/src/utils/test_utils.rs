use std::time::Duration;
use time::OffsetDateTime;

// is only used for testing. WOuld mark with #[cfg(test)] but ide complains in usage that it doesn't exist
#[cfg(test)]
pub fn assert_datetime_eq(left: OffsetDateTime, right: OffsetDateTime, tolerance: Duration) {
    assert!(
        (left.unix_timestamp_nanos() as u128).abs_diff(right.unix_timestamp_nanos() as u128)
            <= tolerance.as_nanos(),
        "Times differ by more than {:?}: left={:?}, right={:?}",
        tolerance,
        left,
        right
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;
    use time::OffsetDateTime;

    #[test]
    fn test_datetime_within_tolerance() {
        let base_time = OffsetDateTime::now_utc();
        let slightly_later = base_time + time::Duration::nanoseconds(500);

        // Should pass with 1 microsecond (1000 nanoseconds) tolerance
        assert_datetime_eq(base_time, slightly_later, Duration::from_nanos(1000));
    }

    #[test]
    #[should_panic(expected = "Times differ by more than")]
    fn test_datetime_exceeds_tolerance() {
        let base_time = OffsetDateTime::now_utc();
        let much_later = base_time + time::Duration::microseconds(10);

        // Should panic because difference (10 microseconds) exceeds tolerance (1 microsecond)
        assert_datetime_eq(base_time, much_later, Duration::from_nanos(1000));
    }
}
