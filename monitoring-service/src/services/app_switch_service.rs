use std::time::{Duration, SystemTime};

use crate::db::models::Activity;

pub struct AppSwitchState {
    current_activity: Option<Activity>,
    pub app_switches: i64,
    last_switch_time: SystemTime,
    min_time_between_switches: Duration,
}

impl AppSwitchState {
    pub fn new(min_time_between_switches: Duration) -> Self {
        AppSwitchState {
            current_activity: None,
            app_switches: 0,
            last_switch_time: SystemTime::now(),
            min_time_between_switches,
        }
    }

    pub fn new_window_activity(&mut self, activity: Activity) {
        if let Some(current_activity) = self.current_activity.clone() {
            if current_activity.app_name != activity.app_name {
                let now = SystemTime::now();
                if now
                    .duration_since(self.last_switch_time)
                    .unwrap_or(Duration::from_secs(0))
                    >= self.min_time_between_switches
                {
                    self.app_switches += 1;
                    self.last_switch_time = now;
                }
                self.current_activity = Some(activity);
            }
        } else {
            self.current_activity = Some(activity);
            self.last_switch_time = SystemTime::now();
        }
    }

    pub fn reset_app_switches(&mut self) {
        self.app_switches = 0;
    }
}

#[cfg(test)]
mod tests {
    use time::OffsetDateTime;

    use crate::db::models::ActivityType;

    use super::*;

    #[test]
    fn test_app_switch() {
        let mut app_switch_state = AppSwitchState::new(Duration::from_millis(1));
        app_switch_state.new_window_activity(Activity::new(
            ActivityType::Window,
            Some("app1".to_string()),
            Some("window1".to_string()),
            None,
            OffsetDateTime::now_utc(),
        ));
        std::thread::sleep(Duration::from_millis(2));
        app_switch_state.new_window_activity(Activity::new(
            ActivityType::Window,
            Some("app2".to_string()),
            Some("window2".to_string()),
            None,
            OffsetDateTime::now_utc(),
        ));
        std::thread::sleep(Duration::from_millis(2));
        app_switch_state.new_window_activity(Activity::new(
            ActivityType::Window,
            Some("app3".to_string()),
            Some("window3".to_string()),
            None,
            OffsetDateTime::now_utc(),
        ));
        std::thread::sleep(Duration::from_millis(2));
        app_switch_state.new_window_activity(Activity::new(
            ActivityType::Window,
            Some("app3".to_string()),
            Some("window4".to_string()),
            None,
            OffsetDateTime::now_utc(),
        ));
        std::thread::sleep(Duration::from_millis(2));
        app_switch_state.new_window_activity(Activity::new(
            ActivityType::Window,
            Some("app3".to_string()),
            Some("window5".to_string()),
            None,
            OffsetDateTime::now_utc(),
        ));
        assert_eq!(app_switch_state.app_switches, 2);
    }

    #[test]
    fn test_spam_app_switch() {
        let mut app_switch_state = AppSwitchState::new(Duration::from_millis(1));
        for i in 0..5 {
            app_switch_state.new_window_activity(Activity::new(
                ActivityType::Window,
                Some(format!("app{}", i)),
                Some(format!("window{}", i)),
                None,
                OffsetDateTime::now_utc(),
            ));
        }
        assert_eq!(app_switch_state.app_switches, 0);
    }

    #[test]
    fn test_app_switch_reset() {
        let mut app_switch_state = AppSwitchState::new(Duration::from_millis(1));
        app_switch_state.new_window_activity(Activity::new(
            ActivityType::Window,
            Some("app1".to_string()),
            Some("window1".to_string()),
            None,
            OffsetDateTime::now_utc(),
        ));
        std::thread::sleep(Duration::from_millis(2));
        app_switch_state.new_window_activity(Activity::new(
            ActivityType::Window,
            Some("app2".to_string()),
            Some("window2".to_string()),
            None,
            OffsetDateTime::now_utc(),
        ));
        app_switch_state.reset_app_switches();
        assert_eq!(app_switch_state.app_switches, 0);
    }
}
