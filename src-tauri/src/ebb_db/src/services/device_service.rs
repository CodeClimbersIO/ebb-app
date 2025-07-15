use sqlx::{Pool, Sqlite};
use time::OffsetDateTime;

use crate::db::{
    device_profile_repo::DeviceProfileRepo,
    device_repo::DeviceRepo,
    models::device_profile::{DevicePreference, DeviceProfile},
};

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct SmartFocusSettings {
    pub enabled: bool,
    #[serde(default = "default_trigger_duration")]
    pub trigger_duration_minutes: i32,
    #[serde(default = "default_doomscroll_duration")]
    pub doomscroll_duration_minutes: i32,
    pub workflow_id: Option<String>,
}

fn default_trigger_duration() -> i32 {
    10 // Default to 10 minutes
}

fn default_doomscroll_duration() -> i32 {
    30 // Default to 30 minutes
}

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

    pub async fn get_smart_focus_settings(&self) -> Result<Option<SmartFocusSettings>> {
        let settings = self
            .get_current_device_preference::<SmartFocusSettings>("smart_focus_settings")
            .await?;
        Ok(settings)
    }

    pub async fn set_smart_focus_settings(&self, settings: SmartFocusSettings) -> Result<()> {
        self.set_current_device_preference("smart_focus_settings", settings)
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

    #[tokio::test]
    async fn set_get_smart_focus_settings() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let service = DeviceService::new_with_pool(pool);

        let settings = SmartFocusSettings {
            enabled: true,
            trigger_duration_minutes: 15,
            doomscroll_duration_minutes: 30,
            workflow_id: Some("test-workflow-id".to_string()),
        };

        if let Err(e) = service.set_smart_focus_settings(settings.clone()).await {
            panic!("Failed to set smart focus settings: {:?}", e);
        }

        if let Ok(Some(retrieved_settings)) = service.get_smart_focus_settings().await {
            assert_eq!(retrieved_settings.enabled, settings.enabled);
            assert_eq!(
                retrieved_settings.trigger_duration_minutes,
                settings.trigger_duration_minutes
            );
            assert_eq!(
                retrieved_settings.doomscroll_duration_minutes,
                settings.doomscroll_duration_minutes
            );
            assert_eq!(retrieved_settings.workflow_id, settings.workflow_id);
        } else {
            panic!("Smart focus settings not found");
        }

        Ok(())
    }
}
