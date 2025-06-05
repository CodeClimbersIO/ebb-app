use serde::{Deserialize, Serialize};
use sqlx::{Decode, Encode, FromRow, Type};
use std::collections::HashMap;
use time::OffsetDateTime;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct DevicePreference {
    // Define common preference fields with defaults
    #[serde(default)]
    pub global_focus_shortcut: Option<String>,

    #[serde(default)]
    pub autostart_enabled: Option<bool>,

    #[serde(default)]
    pub idle_sensitivity: Option<i32>,

    // Catch-all for other preferences stored as JSON
    #[serde(flatten)]
    pub additional: HashMap<String, serde_json::Value>,
}

impl DevicePreference {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get_preference<T: for<'a> Deserialize<'a>>(&self, key: &str) -> Option<T> {
        self.additional
            .get(key)
            .and_then(|v| serde_json::from_value(v.clone()).ok())
    }

    pub fn set_preference<T: Serialize>(
        &mut self,
        key: &str,
        value: T,
    ) -> Result<(), serde_json::Error> {
        let json_value = serde_json::to_value(value)?;
        self.additional.insert(key.to_string(), json_value);
        Ok(())
    }
}

// Custom implementation for SQLx to handle JSON serialization
impl Type<sqlx::Sqlite> for DevicePreference {
    fn type_info() -> sqlx::sqlite::SqliteTypeInfo {
        <String as Type<sqlx::Sqlite>>::type_info()
    }
}

impl<'r> Decode<'r, sqlx::Sqlite> for DevicePreference {
    fn decode(value: sqlx::sqlite::SqliteValueRef<'r>) -> Result<Self, sqlx::error::BoxDynError> {
        let json_str = <String as Decode<sqlx::Sqlite>>::decode(value)?;
        let preferences: DevicePreference = serde_json::from_str(&json_str)?;
        Ok(preferences)
    }
}

impl<'q> Encode<'q, sqlx::Sqlite> for DevicePreference {
    fn encode_by_ref(
        &self,
        args: &mut Vec<sqlx::sqlite::SqliteArgumentValue<'q>>,
    ) -> Result<sqlx::encode::IsNull, Box<dyn std::error::Error + Send + Sync>> {
        let json_str = serde_json::to_string(self)?;
        args.push(sqlx::sqlite::SqliteArgumentValue::Text(json_str.into()));
        Ok(sqlx::encode::IsNull::No)
    }
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct DeviceProfile {
    pub id: String,
    pub user_id: Option<String>,
    pub device_id: String,
    pub preferences: DevicePreference,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}

impl DeviceProfile {
    pub fn new() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            user_id: None,
            device_id: Uuid::new_v4().to_string(),
            preferences: DevicePreference::new(),
            created_at: OffsetDateTime::now_utc(),
            updated_at: OffsetDateTime::now_utc(),
        }
    }
    pub fn new_with_preferences(preferences: DevicePreference) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            user_id: None,
            device_id: Uuid::new_v4().to_string(),
            preferences,
            created_at: OffsetDateTime::now_utc(),
            updated_at: OffsetDateTime::now_utc(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_set_and_get_string_preference() {
        let mut prefs = DevicePreference::new();

        // Set a string preference
        prefs.set_preference("language", "en-US").unwrap();

        // Get it back
        let language: Option<String> = prefs.get_preference("language");
        assert_eq!(language, Some("en-US".to_string()));
    }

    #[test]
    fn test_set_and_get_bool_preference() {
        let mut prefs = DevicePreference::new();

        // Set a boolean preference
        prefs.set_preference("notifications_enabled", true).unwrap();

        // Get it back
        let notifications: Option<bool> = prefs.get_preference("notifications_enabled");
        assert_eq!(notifications, Some(true));
    }

    #[test]
    fn test_set_and_get_number_preference() {
        let mut prefs = DevicePreference::new();

        // Set a number preference
        prefs.set_preference("max_sessions", 42i32).unwrap();

        // Get it back
        let max_sessions: Option<i32> = prefs.get_preference("max_sessions");
        assert_eq!(max_sessions, Some(42));
    }

    #[test]
    fn test_get_nonexistent_preference() {
        let prefs = DevicePreference::new();

        // Try to get a preference that doesn't exist
        let nonexistent: Option<String> = prefs.get_preference("does_not_exist");
        assert_eq!(nonexistent, None);
    }

    #[test]
    fn test_overwrite_preference() {
        let mut prefs = DevicePreference::new();

        // Set initial value
        prefs.set_preference("counter", 1i32).unwrap();
        let initial: Option<i32> = prefs.get_preference("counter");
        assert_eq!(initial, Some(1));

        // Overwrite with new value
        prefs.set_preference("counter", 5i32).unwrap();
        let updated: Option<i32> = prefs.get_preference("counter");
        assert_eq!(updated, Some(5));
    }

    #[test]
    fn test_multiple_preferences() {
        let mut prefs = DevicePreference::new();

        // Set multiple preferences
        prefs.set_preference("name", "Alice").unwrap();
        prefs.set_preference("age", 30i32).unwrap();
        prefs.set_preference("is_admin", false).unwrap();

        // Get them back
        let name: Option<String> = prefs.get_preference("name");
        let age: Option<i32> = prefs.get_preference("age");
        let is_admin: Option<bool> = prefs.get_preference("is_admin");

        assert_eq!(name, Some("Alice".to_string()));
        assert_eq!(age, Some(30));
        assert_eq!(is_admin, Some(false));
    }

    #[test]
    fn test_wrong_type_returns_none() {
        let mut prefs = DevicePreference::new();

        // Set a string preference
        prefs.set_preference("setting", "hello").unwrap();

        // Try to get it as an integer (should return None)
        let as_int: Option<i32> = prefs.get_preference("setting");
        assert_eq!(as_int, None);

        // But getting it as the correct type should work
        let as_string: Option<String> = prefs.get_preference("setting");
        assert_eq!(as_string, Some("hello".to_string()));
    }

    #[test]
    fn test_user_profile_idle_sensitivity() {
        let mut prefs = DevicePreference::new();
        prefs.set_preference("idle_sensitivity", 30i32).unwrap();
        let idle_sensitivity: Option<i32> = prefs.get_preference("idle_sensitivity");
        assert_eq!(idle_sensitivity, Some(30));
    }
}
