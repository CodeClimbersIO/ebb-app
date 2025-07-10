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
    pub preload: Vec<String>,
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

/// Channel for notifying when migrations are complete
pub type MigrationCompleteNotifier = tokio::sync::broadcast::Sender<()>;

/// Allows blocking on async code without creating a nested runtime.
fn run_async_command<F: std::future::Future>(cmd: F) -> F::Output {
    if tokio::runtime::Handle::try_current().is_ok() {
        tokio::task::block_in_place(|| tokio::runtime::Handle::current().block_on(cmd))
    } else {
        tauri::async_runtime::block_on(cmd)
    }
}

/// Tauri shared SQL plugin builder.
pub struct Builder {
    migrations: Option<HashMap<String, MigrationList>>,
    migration_notifier: Option<MigrationCompleteNotifier>,
}

impl Default for Builder {
    fn default() -> Self {
        Self {
            migrations: None,
            migration_notifier: None,
        }
    }
}

impl Builder {
    pub fn new() -> Self {
        Self::default()
    }

    /// Create a new builder with a migration notifier channel.
    /// Returns (builder, receiver) - use the receiver to listen for migration completion.
    pub fn new_with_notifier() -> (Self, tokio::sync::broadcast::Receiver<()>) {
        let (tx, rx) = tokio::sync::broadcast::channel(1);
        let builder = Self {
            migrations: None,
            migration_notifier: Some(tx),
        };
        (builder, rx)
    }

    /// Add migrations to a database.
    #[must_use]
    pub fn add_migrations(mut self, db_url: &str, migrations: Vec<Migration>) -> Self {
        self.migrations
            .get_or_insert(Default::default())
            .insert(db_url.to_string(), MigrationList(migrations));
        self
    }

    /// Set a channel to notify when migrations are complete.
    /// This is useful for initialization tasks that depend on the database schema being ready.
    #[must_use]
    pub fn with_migration_notifier(mut self, notifier: MigrationCompleteNotifier) -> Self {
        self.migration_notifier = Some(notifier);
        self
    }

    pub fn build<R: Runtime>(self) -> TauriPlugin<R, Option<PluginConfig>> {
        self.build_with_config(PluginConfig::default())
    }

    pub fn build_with_config<R: Runtime>(
        mut self,
        config: PluginConfig,
    ) -> TauriPlugin<R, Option<PluginConfig>> {
        let migration_notifier = self.migration_notifier.take();

        PluginBuilder::<R, Option<PluginConfig>>::new("sql")
            .invoke_handler(tauri::generate_handler![
                commands::load,
                commands::execute,
                commands::select,
                commands::close
            ])
            .setup(move |app, api| {
                let plugin_config = api.config().clone().unwrap_or(config);

                run_async_command(async move {
                    let instances = SharedDbInstances::default();
                    let mut lock = instances.0.write().await;

                    for db in plugin_config.preload {
                        log::info!("Connecting to database: {}", db);
                        let pool = SharedDbPool::connect(&db, app).await?;

                        if let Some(migrations) =
                            self.migrations.as_mut().and_then(|mm| mm.remove(&db))
                        {
                            log::info!(
                                "Running {} migrations for database: {}",
                                migrations.0.len(),
                                db
                            );
                            let migrator = Migrator::new(migrations).await?;
                            pool.migrate(&migrator).await?;
                            log::info!("Migrations completed for database: {}", db);
                        } else {
                            log::info!("No migrations to run for database: {}", db);
                        }

                        lock.insert(db, pool);
                    }
                    drop(lock);

                    app.manage(instances);
                    app.manage(Migrations(Mutex::new(
                        self.migrations.take().unwrap_or_default(),
                    )));

                    // Notify that migrations are complete
                    if let Some(notifier) = migration_notifier {
                        let _ = notifier.send(()); // Ignore if no receivers
                    }

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
