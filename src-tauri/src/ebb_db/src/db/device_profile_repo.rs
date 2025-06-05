use serde_json;
use sqlx::{Pool, Sqlite};
use std::sync::Arc;
use time::OffsetDateTime;
use uuid::Uuid;

use crate::db::models::device_profile::{DevicePreference, DeviceProfile};

pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;

pub struct DeviceProfileRepo {
    db: Arc<Pool<Sqlite>>,
}

impl DeviceProfileRepo {
    pub fn new(db: Arc<Pool<Sqlite>>) -> Self {
        Self { db }
    }

    pub async fn get_device_profile(&self, device_id: &str) -> Result<Option<DeviceProfile>> {
        let result = sqlx::query_as::<_, DeviceProfile>(
            "SELECT id, user_id, device_id, preferences, created_at, updated_at FROM device_profile WHERE device_id = ?1",
        )
        .bind(device_id)
        .fetch_optional(&*self.db)
        .await?;

        Ok(result)
    }

    pub async fn create_device_profile(&self, profile: &DeviceProfile) -> Result<()> {
        let preferences_json = serde_json::to_string(&profile.preferences)?;

        sqlx::query(
            "INSERT INTO device_profile (id, user_id, preferences, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)"
        )
        .bind(&profile.id)
        .bind(&profile.user_id)
        .bind(&preferences_json)
        .bind(&profile.created_at)
        .bind(&profile.updated_at)
        .execute(&*self.db)
        .await?;

        Ok(())
    }

    pub async fn update_device_profile(
        &self,
        device_id: &str,
        profile: &DeviceProfile,
    ) -> Result<()> {
        let preferences_json = serde_json::to_string(&profile.preferences)?;

        sqlx::query(
            "UPDATE device_profile SET user_id = ?1, device_id = ?2, preferences = ?3, updated_at = ?4 WHERE device_id = ?5",
        )
        .bind(&profile.user_id)
        .bind(&profile.device_id)
        .bind(&preferences_json)
        .bind(&profile.updated_at)
        .execute(&*self.db)
        .await?;

        Ok(())
    }

    pub async fn update_preferences(&self, id: &str, preferences: &DevicePreference) -> Result<()> {
        let preferences_json = serde_json::to_string(preferences)?;
        let now = OffsetDateTime::now_utc();

        sqlx::query("UPDATE device_profile SET preferences = ?1, updated_at = ?2 WHERE id = ?3")
            .bind(&preferences_json)
            .bind(&now)
            .bind(id)
            .execute(&*self.db)
            .await?;

        Ok(())
    }

    pub async fn get_preference<T: serde::de::DeserializeOwned>(
        &self,
        key: &str,
        device_id: &str,
    ) -> Result<Option<T>> {
        if let Some(profile) = self.get_device_profile(device_id).await? {
            return Ok(profile.preferences.get_preference(key));
        }
        Ok(None)
    }

    pub async fn set_preference<T: serde::Serialize>(
        &self,
        key: &str,
        value: T,
        device_id: &str,
    ) -> Result<()> {
        if let Some(mut profile) = self.get_device_profile(device_id).await? {
            profile.preferences.set_preference(key, value)?;
            profile.updated_at = OffsetDateTime::now_utc();
            self.update_device_profile(device_id, &profile).await?;
        } else {
            // Create new profile if it doesn't exist
            let mut preferences = DevicePreference::new();
            preferences.set_preference(key, value)?;

            let profile = DeviceProfile {
                id: Uuid::new_v4().to_string(),
                user_id: None,
                device_id: Some(device_id.to_string()),
                preferences,
                created_at: OffsetDateTime::now_utc(),
                updated_at: OffsetDateTime::now_utc(),
            };

            self.create_device_profile(&profile).await?;
        }
        Ok(())
    }
}
