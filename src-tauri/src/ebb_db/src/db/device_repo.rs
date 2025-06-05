use sqlx::{Pool, Sqlite};

use crate::db::models::device::Device;

pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;

pub struct DeviceProfileRepo {
    pool: Pool<Sqlite>,
}

impl DeviceProfileRepo {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    pub async fn get_device(&self) -> Result<Option<Device>> {
        let device = sqlx::query_as::<_, Device>("SELECT * FROM device")
            .fetch_optional(&self.pool)
            .await?;
        if let Some(device) = device {
            return Ok(Some(device));
        } else {
            let device = Device::new();
            self.create_device(&device).await?;
            return Ok(Some(device));
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
    async fn test_get_device() -> Result<()> {
        let pool = db_manager::create_test_db().await;
        let repo = DeviceProfileRepo::new(pool);
        let device = repo.get_device().await?;
        if let Some(device) = device {
            assert!(device.id.len() == 36);
        } else {
            panic!("Device not found");
        }
        Ok(())
    }
}
