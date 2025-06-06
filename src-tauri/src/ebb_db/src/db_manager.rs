use sqlx::{Pool, Sqlite, sqlite::SqlitePool};

pub struct DbManager {
    pub pool: Pool<Sqlite>,
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
