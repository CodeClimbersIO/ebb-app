use sqlx::{Pool, Sqlite};
use time::OffsetDateTime;

use crate::db::{
    device_profile_repo::DeviceProfileRepo,
    device_repo::DeviceRepo,
    models::device_profile::{DevicePreference, DeviceProfile},
};

pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;
pub struct DeviceService {
    device_repo: DeviceRepo,
    device_profile_repo: DeviceProfileRepo,
}

impl DeviceService {
    pub fn new_with_pool(pool: Pool<Sqlite>) -> Self {
        Self {
            device_repo: DeviceRepo::new(pool.clone()),
            device_profile_repo: DeviceProfileRepo::new(pool.clone()),
        }
    }

    pub async fn get_current_device_preference<T: serde::de::DeserializeOwned>(
        &self,
        key: &str,
    ) -> Result<Option<T>> {
        let device = self.device_repo.get_device().await?;
        if let Some(profile) = self
            .device_profile_repo
            .get_device_profile(&device.id)
            .await?
        {
            return Ok(profile.preferences.get_preference(key));
        } else {
            let profile = DeviceProfile::new(device.id.clone());
            self.device_profile_repo
                .create_device_profile(&profile)
                .await?;

            if let Some(profile) = self
                .device_profile_repo
                .get_device_profile(&device.id)
                .await?
            {
                return Ok(profile.preferences.get_preference(key));
            } else {
                return Ok(None);
            }
        }
    }

    pub async fn set_current_device_preference<T: serde::Serialize>(
        &self,
        key: &str,
        value: T,
    ) -> Result<()> {
        let device = self.device_repo.get_device().await?;
        if let Some(mut profile) = self
            .device_profile_repo
            .get_device_profile(&device.id)
            .await?
        {
            profile.preferences.set_preference(key, value)?;
            profile.updated_at = OffsetDateTime::now_utc();
            self.device_profile_repo
                .update_device_profile_preferences(&device.id, &profile.preferences)
                .await?;
        } else {
            // Create new profile if it doesn't exist
            let mut preferences = DevicePreference::new();
            preferences.set_preference(key, value)?;

            let profile = DeviceProfile::new_with_preferences(preferences, device.id);
            self.device_profile_repo
                .create_device_profile(&profile)
                .await?
        }
        Ok(())
    }

    pub async fn get_idle_sensitivity(&self) -> Result<i32> {
        let sensitivity = self
            .get_current_device_preference::<i32>("idle_sensitivity")
            .await?;
        Ok(sensitivity.unwrap_or(60))
    }

    pub async fn set_idle_sensitivity(&self, sensitivity: i32) -> Result<()> {
        self.set_current_device_preference("idle_sensitivity", sensitivity)
            .await?;
        Ok(())
    }

    pub async fn get_device_profile(&self) -> Result<DeviceProfile> {
        let device = self.device_repo.get_device().await?;
        let profile = self
            .device_profile_repo
            .get_device_profile(&device.id)
            .await?;
        if let Some(profile) = profile {
            Ok(profile)
        } else {
            let profile = DeviceProfile::new(device.id);
            self.device_profile_repo
                .create_device_profile(&profile)
                .await?;
            Ok(profile)
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::db_manager;

    use super::*;

    #[tokio::test]
    async fn set_get_preference() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let service = DeviceService::new_with_pool(pool);

        if let Err(e) = service
            .set_current_device_preference("test_key", "test_value")
            .await
        {
            panic!("Failed to set preference: {:?}", e);
        };

        if let Ok(Some(preference)) = service
            .get_current_device_preference::<String>("test_key")
            .await
        {
            assert_eq!(preference, "test_value");
        } else {
            panic!("Preference not found");
        }

        Ok(())
    }

    #[tokio::test]
    async fn set_get_idle_sensitivity() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let service = DeviceService::new_with_pool(pool);

        if let Err(e) = service.set_idle_sensitivity(100).await {
            panic!("Failed to set idle sensitivity: {:?}", e);
        }

        if let Ok(sensitivity) = service.get_idle_sensitivity().await {
            assert_eq!(sensitivity, 100);
        } else {
            panic!("Idle sensitivity not found");
        }

        Ok(())
    }

    #[tokio::test]
    async fn get_device_profile() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let service = DeviceService::new_with_pool(pool);
        let profile = service.get_device_profile().await?;
        assert_eq!(profile.id.len(), 36);
        Ok(())
    }

    #[tokio::test]
    async fn get_device_profile_gets_the_same_profile_every_time() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let service = DeviceService::new_with_pool(pool);
        let profile = service.get_device_profile().await?;
        let profile2 = service.get_device_profile().await?;
        assert_eq!(profile.id, profile2.id);
        Ok(())
    }
}
