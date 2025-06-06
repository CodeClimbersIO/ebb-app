use serde_json;
use sqlx::{Pool, Sqlite};
use time::OffsetDateTime;

use crate::db::models::device_profile::{DevicePreference, DeviceProfile};

pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;

pub struct DeviceProfileRepo {
    pool: Pool<Sqlite>,
}

impl DeviceProfileRepo {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    pub async fn get_device_profile(&self, device_id: &str) -> Result<Option<DeviceProfile>> {
        let result = sqlx::query_as::<_, DeviceProfile>(
            "SELECT id, user_id, device_id, preferences, created_at, updated_at FROM device_profile WHERE device_id = ?1",
        )
        .bind(device_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(result)
    }

    pub async fn create_device_profile(&self, profile: &DeviceProfile) -> Result<()> {
        let preferences_json = serde_json::to_string(&profile.preferences)?;

        sqlx::query(
            "INSERT INTO device_profile (id, user_id, device_id, preferences, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
        )
        .bind(&profile.id)
        .bind(&profile.user_id)
        .bind(&profile.device_id)
        .bind(&preferences_json)
        .bind(&profile.created_at)
        .bind(&profile.updated_at)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn update_device_profile_preferences(
        &self,
        device_id: &str,
        preferences: &DevicePreference,
    ) -> Result<()> {
        let preferences_json = serde_json::to_string(preferences)?;

        let now = OffsetDateTime::now_utc();
        sqlx::query(
            "UPDATE device_profile SET preferences = ?1, updated_at = ?2 WHERE device_id = ?3",
        )
        .bind(&preferences_json)
        .bind(&now)
        .bind(device_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use crate::db_manager;

    use super::*;

    #[tokio::test]
    async fn create_and_get_device_profile() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let repo = DeviceProfileRepo::new(pool);

        let profile = DeviceProfile::new("test_device_id".to_string());

        if let Err(e) = repo.create_device_profile(&profile).await {
            panic!("Failed to create device profile: {:?}", e);
        };

        match repo.get_device_profile("test_device_id").await {
            Ok(Some(profile)) => {
                assert_eq!(profile.device_id, "test_device_id".to_string());
                assert_eq!(profile.user_id, None);
            }
            Ok(None) => return Err("Profile not found".into()),
            Err(e) => return Err(e.into()),
        }

        Ok(())
    }
}
