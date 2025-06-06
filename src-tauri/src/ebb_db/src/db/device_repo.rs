use sqlx::{Pool, Sqlite};

use crate::db::models::device::Device;

pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;

pub struct DeviceRepo {
    pool: Pool<Sqlite>,
}

impl DeviceRepo {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    pub async fn get_device(&self) -> Result<Device> {
        let device = sqlx::query_as::<_, Device>("SELECT * FROM device")
            .fetch_optional(&self.pool)
            .await?;
        if let Some(device) = device {
            return Ok(device);
        } else {
            let device = Device::new();
            self.create_device(&device).await?;
            return Ok(device);
        }
    }

    pub async fn create_device(&self, device: &Device) -> Result<()> {
        sqlx::query("INSERT INTO device (id, created_at, updated_at) VALUES (?1, ?2, ?3)")
            .bind(&device.id)
            .bind(&device.created_at)
            .bind(&device.updated_at)
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
    async fn test_get_device_returns_new_device_if_none_exists() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let repo = DeviceRepo::new(pool);
        let device = repo.get_device().await?;
        assert!(device.id.len() == 36);
        Ok(())
    }

    #[tokio::test]
    async fn test_get_device_returns_existing_device() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let repo = DeviceRepo::new(pool);
        let device_1 = repo.get_device().await?;
        let device_2 = repo.get_device().await?;
        assert_eq!(device_1.id, device_2.id);
        Ok(())
    }
}
