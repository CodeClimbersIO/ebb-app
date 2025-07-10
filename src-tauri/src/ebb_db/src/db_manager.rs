use sqlx::{Pool, Sqlite, sqlite::SqlitePool};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{Mutex, OnceCell};

pub struct DbManager {
    pub pool: Pool<Sqlite>,
}

// Global singleton for shared connection pools
static SHARED_POOLS: OnceCell<Mutex<HashMap<String, Arc<DbManager>>>> = OnceCell::const_new();

async fn get_shared_pools() -> &'static Mutex<HashMap<String, Arc<DbManager>>> {
    SHARED_POOLS
        .get_or_init(|| async { Mutex::new(HashMap::new()) })
        .await
}

pub fn get_default_ebb_db_path() -> String {
    let home_dir = dirs::home_dir().expect("Could not find home directory");
    home_dir
        .join(".ebb")
        .join("ebb-desktop.sqlite")
        .to_str()
        .expect("Invalid path")
        .to_string()
}

pub fn get_default_codeclimbers_db_path() -> String {
    let home_dir = dirs::home_dir().expect("Could not find home directory");
    home_dir
        .join(".codeclimbers")
        .join("codeclimbers-desktop.sqlite")
        .to_str()
        .expect("Invalid path")
        .to_string()
}

pub fn get_db_path() -> String {
    get_default_ebb_db_path()
}

#[cfg(test)]
pub fn get_test_db_path() -> String {
    let home_dir = dirs::home_dir().expect("Could not find home directory");
    home_dir
        .join(".ebb")
        .join("ebb-desktop-test.sqlite")
        .to_str()
        .expect("Invalid path")
        .to_string()
}

#[cfg(test)]
pub async fn create_test_db() -> SqlitePool {
    use sqlx::sqlite::SqlitePoolOptions;
    // let db_path = get_test_db_path();
    let db_path = ":memory:";
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&format!("sqlite:{db_path}"))
        .await
        .unwrap();

    set_wal_mode(&pool).await.unwrap();
    crate::migrations::run_test_migrations(&pool).await;

    pool
}

async fn set_wal_mode(pool: &sqlx::SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query("PRAGMA journal_mode=WAL;")
        .execute(pool)
        .await?;
    Ok(())
}

impl DbManager {
    /// Create a new DbManager with a dedicated connection pool
    /// This creates a separate pool and should only be used when connection sharing is not needed
    pub async fn new(db_path: &str) -> Result<Self, sqlx::Error> {
        let database_url = format!("sqlite:{db_path}");

        let path = std::path::Path::new(db_path);
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| sqlx::Error::Configuration(Box::new(e)))?;
        }
        log::trace!("database_url: {}", database_url);

        // Debug information
        log::trace!("Attempting to open/create database at: {}", db_path);

        match std::fs::OpenOptions::new()
            .create(true)
            .write(true)
            .open(db_path)
        {
            Ok(_) => log::trace!("Successfully created/opened database file"),
            Err(e) => log::error!("Error creating/opening database file: {}", e),
        }

        let pool = SqlitePool::connect(&database_url).await?;

        set_wal_mode(&pool).await?;
        // sqlx::migrate!().run(&pool).await.unwrap();

        Ok(Self { pool })
    }

    /// Get or create a shared DbManager instance for the given database path
    /// This ensures all callers get the same connection pool for the same database
    pub async fn get_shared(db_path: &str) -> Result<Arc<Self>, sqlx::Error> {
        let pools = get_shared_pools().await;
        let mut pools_guard = pools.lock().await;

        // Check if we already have a shared instance for this path
        if let Some(existing) = pools_guard.get(db_path) {
            log::trace!("Reusing existing shared connection pool for: {}", db_path);
            return Ok(existing.clone());
        }

        // Create new shared instance
        log::trace!("Creating new shared connection pool for: {}", db_path);
        let db_manager = Self::new(db_path).await?;
        let shared_manager = Arc::new(db_manager);

        // Store for future reuse
        pools_guard.insert(db_path.to_string(), shared_manager.clone());

        Ok(shared_manager)
    }

    /// Get the default shared ebb database connection
    pub async fn get_shared_ebb() -> Result<Arc<Self>, sqlx::Error> {
        Self::get_shared(&get_default_ebb_db_path()).await
    }

    /// Get the default shared codeclimbers database connection  
    pub async fn get_shared_codeclimbers() -> Result<Arc<Self>, sqlx::Error> {
        Self::get_shared(&get_default_codeclimbers_db_path()).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_db_manager() {
        let db_path = get_test_db_path();
        let db_manager = DbManager::new(&db_path).await.unwrap();
        let result: Result<i32, _> = sqlx::query_scalar("SELECT 1")
            .fetch_one(&db_manager.pool)
            .await;
        assert_eq!(result.unwrap(), 1);
    }

    #[tokio::test]
    async fn test_migrations() {
        let _ = create_test_db().await;
    }

    #[tokio::test]
    async fn test_db_manager_new() {
        let db_path = get_test_db_path();
        let db_manager = DbManager::new(&db_path).await.unwrap();
        let result: Result<i32, _> = sqlx::query_scalar("SELECT 1")
            .fetch_one(&db_manager.pool)
            .await;
        assert_eq!(result.unwrap(), 1);
    }

    #[tokio::test]
    async fn test_codeclimbers_codeclimbers_path() {
        let db_path = get_default_codeclimbers_db_path();
        assert!(db_path.ends_with(".codeclimbers/codeclimbers-desktop.sqlite"));
    }

    #[tokio::test]
    async fn test_ebb_db_path() {
        let db_path = get_default_ebb_db_path();
        let default_db_path = get_db_path();
        assert!(db_path.ends_with(".ebb/ebb-desktop.sqlite"));
        assert_eq!(db_path, default_db_path);
    }

    #[tokio::test]
    async fn test_test_db_path() {
        let db_path = get_test_db_path();
        assert!(db_path.ends_with("ebb-desktop-test.sqlite"));
    }
}
