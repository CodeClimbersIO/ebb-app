//! Custom SQL plugin that uses shared DbManager connection pools
//! Based on tauri-plugin-sql v2 architecture

mod commands;
mod error;
mod wrapper;

pub use error::Error;
pub use wrapper::SharedDbPool;

use futures_core::future::BoxFuture;
use serde::{Deserialize, Serialize};
use sqlx::{
    error::BoxDynError,
    migrate::{Migration as SqlxMigration, MigrationSource, MigrationType, Migrator},
};
use tauri::{
    Manager, RunEvent, Runtime,
    plugin::{Builder as PluginBuilder, TauriPlugin},
};
use tokio::sync::{Mutex, RwLock};

use std::collections::HashMap;

#[derive(Default)]
pub struct SharedDbInstances(pub RwLock<HashMap<String, SharedDbPool>>);

#[derive(Serialize)]
#[serde(untagged)]
pub(crate) enum LastInsertId {
    Sqlite(i64),
}

struct Migrations(Mutex<HashMap<String, MigrationList>>);

#[derive(Default, Clone, Deserialize)]
pub struct PluginConfig {
    #[serde(default)]
    preload: Vec<String>,
}

#[derive(Debug)]
pub enum MigrationKind {
    Up,
    Down,
}

impl From<MigrationKind> for MigrationType {
    fn from(kind: MigrationKind) -> Self {
        match kind {
            MigrationKind::Up => Self::ReversibleUp,
            MigrationKind::Down => Self::ReversibleDown,
        }
    }
}

/// A migration definition.
#[derive(Debug)]
pub struct Migration {
    pub version: i64,
    pub description: &'static str,
    pub sql: &'static str,
    pub kind: MigrationKind,
}

#[derive(Debug)]
struct MigrationList(Vec<Migration>);

impl MigrationSource<'static> for MigrationList {
    fn resolve(self) -> BoxFuture<'static, std::result::Result<Vec<SqlxMigration>, BoxDynError>> {
        Box::pin(async move {
            let mut migrations = Vec::new();
            for migration in self.0 {
                if matches!(migration.kind, MigrationKind::Up) {
                    migrations.push(SqlxMigration::new(
                        migration.version,
                        migration.description.into(),
                        migration.kind.into(),
                        migration.sql.into(),
                        false,
                    ));
                }
            }
            Ok(migrations)
        })
    }
}

/// Allows blocking on async code without creating a nested runtime.
fn run_async_command<F: std::future::Future>(cmd: F) -> F::Output {
    if tokio::runtime::Handle::try_current().is_ok() {
        tokio::task::block_in_place(|| tokio::runtime::Handle::current().block_on(cmd))
    } else {
        tauri::async_runtime::block_on(cmd)
    }
}

/// Tauri shared SQL plugin builder.
#[derive(Default)]
pub struct Builder {
    migrations: Option<HashMap<String, MigrationList>>,
}

impl Builder {
    pub fn new() -> Self {
        Self::default()
    }

    /// Add migrations to a database.
    #[must_use]
    pub fn add_migrations(mut self, db_url: &str, migrations: Vec<Migration>) -> Self {
        self.migrations
            .get_or_insert(Default::default())
            .insert(db_url.to_string(), MigrationList(migrations));
        self
    }

    pub fn build<R: Runtime>(mut self) -> TauriPlugin<R, Option<PluginConfig>> {
        PluginBuilder::<R, Option<PluginConfig>>::new("sql")
            .invoke_handler(tauri::generate_handler![
                commands::load,
                commands::execute,
                commands::select,
                commands::close
            ])
            .setup(|app, api| {
                let config = api.config().clone().unwrap_or_default();

                run_async_command(async move {
                    let instances = SharedDbInstances::default();
                    let mut lock = instances.0.write().await;

                    for db in config.preload {
                        let pool = SharedDbPool::connect(&db, app).await?;

                        if let Some(migrations) =
                            self.migrations.as_mut().and_then(|mm| mm.remove(&db))
                        {
                            let migrator = Migrator::new(migrations).await?;
                            pool.migrate(&migrator).await?;
                        }

                        lock.insert(db, pool);
                    }
                    drop(lock);

                    app.manage(instances);
                    app.manage(Migrations(Mutex::new(
                        self.migrations.take().unwrap_or_default(),
                    )));

                    Ok(())
                })
            })
            .on_event(|app, event| {
                if let RunEvent::Exit = event {
                    run_async_command(async move {
                        let instances = &*app.state::<SharedDbInstances>();
                        let instances = instances.0.read().await;
                        for value in instances.values() {
                            value.close().await;
                        }
                    });
                }
            })
            .build()
    }
}
