use sqlx::{Pool, Sqlite};

use crate::db::models::tag::Tag;

pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;

pub struct TagRepo {
    pool: Pool<Sqlite>,
}

impl TagRepo {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    /// Get a tag by its name
    pub async fn get_tag_by_name(&self, name: &str) -> Result<Option<Tag>> {
        let tag = sqlx::query_as::<_, Tag>(
            "SELECT * FROM tag WHERE name = ?1"
        )
        .bind(name)
        .fetch_optional(&self.pool)
        .await?;

        Ok(tag)
    }

    /// Get a tag by its ID
    pub async fn get_tag_by_id(&self, id: &str) -> Result<Option<Tag>> {
        let tag = sqlx::query_as::<_, Tag>(
            "SELECT * FROM tag WHERE id = ?1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(tag)
    }

    /// Get all tags
    pub async fn get_all_tags(&self) -> Result<Vec<Tag>> {
        let tags = sqlx::query_as::<_, Tag>(
            "SELECT * FROM tag ORDER BY name ASC"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(tags)
    }

    /// Get tags by type
    pub async fn get_tags_by_type(&self, tag_type: &str) -> Result<Vec<Tag>> {
        let tags = sqlx::query_as::<_, Tag>(
            "SELECT * FROM tag WHERE tag_type = ?1 ORDER BY name ASC"
        )
        .bind(tag_type)
        .fetch_all(&self.pool)
        .await?;

        Ok(tags)
    }

    /// Check if a tag exists by name
    pub async fn tag_exists(&self, name: &str) -> Result<bool> {
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM tag WHERE name = ?1"
        )
        .bind(name)
        .fetch_one(&self.pool)
        .await?;

        Ok(count > 0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;

    async fn create_test_db() -> Pool<Sqlite> {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();

        // Set WAL mode
        sqlx::query("PRAGMA journal_mode=WAL;")
            .execute(&pool)
            .await
            .unwrap();

        // Create the tag table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS tag (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                parent_tag_id TEXT,
                tag_type TEXT NOT NULL,
                is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
                is_default BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_tag_id) REFERENCES tag(id),
                UNIQUE(name, tag_type)
            )"
        )
        .execute(&pool)
        .await
        .unwrap();

        pool
    }

    #[tokio::test]
    async fn test_tag_repo_creation() -> Result<()> {
        let pool = create_test_db().await;
        let _repo = TagRepo::new(pool);
        Ok(())
    }

    #[tokio::test]
    async fn test_get_tag_by_name() -> Result<()> {
        let pool = create_test_db().await;
        let repo = TagRepo::new(pool.clone());

        let now = time::OffsetDateTime::now_utc();

        // Insert test tag
        sqlx::query(
            "INSERT INTO tag (id, name, parent_tag_id, tag_type, is_blocked, is_default, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
        )
        .bind("test-tag-1")
        .bind("creating")
        .bind::<Option<String>>(None)
        .bind("activity")
        .bind(false)
        .bind(true)
        .bind(now)
        .bind(now)
        .execute(&pool)
        .await?;

        // Test retrieval by name
        let result = repo.get_tag_by_name("creating").await?;
        assert!(result.is_some());
        
        let tag = result.unwrap();
        assert_eq!(tag.id, "test-tag-1");
        assert_eq!(tag.name, "creating");
        assert_eq!(tag.tag_type, "activity");
        assert!(!tag.is_blocked);
        assert!(tag.is_default);

        Ok(())
    }

    #[tokio::test]
    async fn test_get_tag_by_name_not_found() -> Result<()> {
        let pool = create_test_db().await;
        let repo = TagRepo::new(pool);

        let result = repo.get_tag_by_name("nonexistent").await?;
        assert!(result.is_none());

        Ok(())
    }

    #[tokio::test]
    async fn test_tag_exists() -> Result<()> {
        let pool = create_test_db().await;
        let repo = TagRepo::new(pool.clone());

        let now = time::OffsetDateTime::now_utc();

        // Insert test tag
        sqlx::query(
            "INSERT INTO tag (id, name, parent_tag_id, tag_type, is_blocked, is_default, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
        )
        .bind("test-tag-2")
        .bind("learning")
        .bind::<Option<String>>(None)
        .bind("activity")
        .bind(false)
        .bind(false)
        .bind(now)
        .bind(now)
        .execute(&pool)
        .await?;

        // Test exists
        assert!(repo.tag_exists("learning").await?);
        assert!(!repo.tag_exists("nonexistent").await?);

        Ok(())
    }
}