use indexmap::IndexMap;
use serde_json::Value as JsonValue;
use sqlx::{Column, Executor, Row, Value};
use std::sync::Arc;
use tauri::{AppHandle, Runtime};

use crate::db_manager::DbManager;
use crate::shared_sql_plugin::LastInsertId;

pub enum SharedDbPool {
    Sqlite(Arc<DbManager>),
}

impl SharedDbPool {
    pub(crate) async fn connect<R: Runtime>(
        conn_url: &str,
        _app: &AppHandle<R>,
    ) -> Result<Self, crate::shared_sql_plugin::Error> {
        match conn_url
            .split_once(':')
            .ok_or_else(|| crate::shared_sql_plugin::Error::InvalidDbUrl(conn_url.to_string()))?
            .0
        {
            "sqlite" => {
                // Parse the database URL to get the path
                let db_path = if conn_url.starts_with("sqlite:") {
                    conn_url.strip_prefix("sqlite:").unwrap_or(conn_url)
                } else {
                    conn_url
                };

                // Get shared DbManager instance - this reuses existing connection pools!
                let shared_db_manager = DbManager::get_shared(db_path).await?;
                Ok(Self::Sqlite(shared_db_manager))
            }
            _ => Err(crate::shared_sql_plugin::Error::InvalidDbUrl(
                conn_url.to_string(),
            )),
        }
    }

    pub(crate) async fn migrate(
        &self,
        migrator: &sqlx::migrate::Migrator,
    ) -> Result<(), crate::shared_sql_plugin::Error> {
        match self {
            SharedDbPool::Sqlite(db_manager) => {
                migrator.run(&db_manager.pool).await?;
            }
        }
        Ok(())
    }

    pub(crate) async fn close(&self) {
        match self {
            SharedDbPool::Sqlite(db_manager) => {
                db_manager.pool.close().await;
            }
        }
    }

    pub(crate) async fn execute(
        &self,
        query: String,
        values: Vec<JsonValue>,
    ) -> Result<(u64, LastInsertId), crate::shared_sql_plugin::Error> {
        Ok(match self {
            SharedDbPool::Sqlite(db_manager) => {
                let mut query = sqlx::query(&query);
                for value in values {
                    if value.is_null() {
                        query = query.bind(None::<JsonValue>);
                    } else if value.is_string() {
                        query = query.bind(value.as_str().unwrap().to_owned())
                    } else if let Some(number) = value.as_number() {
                        query = query.bind(number.as_f64().unwrap_or_default())
                    } else {
                        query = query.bind(value);
                    }
                }
                let result = db_manager.pool.execute(query).await?;
                (
                    result.rows_affected(),
                    LastInsertId::Sqlite(result.last_insert_rowid()),
                )
            }
        })
    }

    pub(crate) async fn select(
        &self,
        query: String,
        values: Vec<JsonValue>,
    ) -> Result<Vec<IndexMap<String, JsonValue>>, crate::shared_sql_plugin::Error> {
        Ok(match self {
            SharedDbPool::Sqlite(db_manager) => {
                let mut query = sqlx::query(&query);
                for value in values {
                    if value.is_null() {
                        query = query.bind(None::<JsonValue>);
                    } else if value.is_string() {
                        query = query.bind(value.as_str().unwrap().to_owned())
                    } else if let Some(number) = value.as_number() {
                        query = query.bind(number.as_f64().unwrap_or_default())
                    } else {
                        query = query.bind(value);
                    }
                }
                let rows = db_manager.pool.fetch_all(query).await?;
                let mut values = Vec::new();
                for row in rows {
                    let mut value = IndexMap::default();
                    for (i, column) in row.columns().iter().enumerate() {
                        let v = row.try_get_raw(i)?;
                        let v = sqlite_to_json(v)?;
                        value.insert(column.name().to_string(), v);
                    }
                    values.push(value);
                }
                values
            }
        })
    }
}

/// Convert SQLite values to JSON (simplified decode function)
fn sqlite_to_json(
    v: sqlx::sqlite::SqliteValueRef,
) -> Result<JsonValue, crate::shared_sql_plugin::Error> {
    use sqlx::{TypeInfo, ValueRef};
    use time::{Date, PrimitiveDateTime, Time};

    if v.is_null() {
        return Ok(JsonValue::Null);
    }

    let res = match v.type_info().name() {
        "TEXT" => {
            if let Ok(v) = v.to_owned().try_decode() {
                JsonValue::String(v)
            } else {
                JsonValue::Null
            }
        }
        "REAL" => {
            if let Ok(v) = v.to_owned().try_decode::<f64>() {
                JsonValue::from(v)
            } else {
                JsonValue::Null
            }
        }
        "INTEGER" | "NUMERIC" => {
            if let Ok(v) = v.to_owned().try_decode::<i64>() {
                JsonValue::Number(v.into())
            } else {
                JsonValue::Null
            }
        }
        "BOOLEAN" => {
            if let Ok(v) = v.to_owned().try_decode() {
                JsonValue::Bool(v)
            } else {
                JsonValue::Null
            }
        }
        "DATE" => {
            if let Ok(v) = v.to_owned().try_decode::<Date>() {
                JsonValue::String(v.to_string())
            } else {
                JsonValue::Null
            }
        }
        "TIME" => {
            if let Ok(v) = v.to_owned().try_decode::<Time>() {
                JsonValue::String(v.to_string())
            } else {
                JsonValue::Null
            }
        }
        "DATETIME" => {
            if let Ok(v) = v.to_owned().try_decode::<PrimitiveDateTime>() {
                JsonValue::String(v.to_string())
            } else {
                JsonValue::Null
            }
        }
        "BLOB" => {
            if let Ok(v) = v.to_owned().try_decode::<Vec<u8>>() {
                JsonValue::Array(v.into_iter().map(|n| JsonValue::Number(n.into())).collect())
            } else {
                JsonValue::Null
            }
        }
        "NULL" => JsonValue::Null,
        _ => {
            return Err(crate::shared_sql_plugin::Error::UnsupportedDatatype(
                v.type_info().name().to_string(),
            ));
        }
    };

    Ok(res)
}
