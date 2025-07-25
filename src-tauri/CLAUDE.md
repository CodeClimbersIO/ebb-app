# Claude AI Development Guide - Rust/Tauri Backend

This guide provides specific patterns and practices for working with the Rust/Tauri backend of this desktop application.

## Overview

This is a Tauri application backend written in Rust that provides system monitoring, app blocking, notifications, and database management for a desktop productivity app.

## Command Patterns

### Tauri Command Structure

All commands exposed to the frontend follow this pattern:

```rust
#[tauri::command]
pub async fn command_name(parameter: Type) -> Result<ReturnType, String> {
    // Implementation
    match operation() {
        Ok(result) => Ok(result),
        Err(e) => Err(e.to_string())
    }
}
```

### Command Registration

Register commands in `main.rs`:

```rust
.invoke_handler(tauri::generate_handler![
    commands::start_blocking,
    commands::stop_blocking,
    commands::check_accessibility_permissions,
    // ... other commands
])
```

### Available Command Categories

**System Permissions & Monitoring:**
```rust
check_accessibility_permissions() -> Result<bool, String>
request_system_permissions() -> Result<bool, String>
start_system_monitoring(app_handle: AppHandle) -> Result<(), String>
is_monitoring_running() -> Result<bool, String>
```

**App Blocking/Control:**
```rust
start_blocking(blocking_apps: Vec<BlockingApp>, is_block_list: bool) -> Result<(), String>
stop_blocking() -> Result<(), String>
snooze_blocking(duration: u64) -> Result<(), String>
```

**Notifications:**
```rust
show_notification(app_handle: AppHandle, notification_type: String, payload: Option<String>) -> Result<(), String>
hide_notification(app_handle: AppHandle) -> Result<(), String>
```

**Utilities:**
```rust
get_app_icon(app_path: String) -> Result<String, String>
detect_spotify() -> Result<bool, String>
get_app_version() -> Result<String, String>
```

## Database Architecture

### Workspace Structure

The database logic is separated into its own crate (`ebb_db`) with this structure:

```
src-tauri/src/ebb_db/
├── src/
│   ├── lib.rs              # Main library exports
│   ├── db_manager.rs       # Connection pool management
│   ├── migrations.rs       # Schema migrations
│   ├── db/
│   │   ├── models/         # Data structures
│   │   └── *_repo.rs       # Repository implementations
│   └── services/           # Business logic services
```

### Database Manager Pattern

```rust
// Singleton pattern for database connections
pub struct DatabaseManager {
    ebb_pool: Arc<RwLock<Option<Pool<Sqlite>>>>,
    monitor_pool: Arc<RwLock<Option<Pool<Sqlite>>>>,
}

impl DatabaseManager {
    pub async fn get_ebb_pool(&self) -> Result<Pool<Sqlite>> {
        // Connection pooling logic with lazy initialization
    }
    
    pub async fn get_monitor_pool(&self) -> Result<Pool<Sqlite>> {
        // Connection pooling logic with lazy initialization
    }
}
```

### Repository Pattern

Each data entity has its own repository:

```rust
pub struct DeviceRepo {
    pool: Pool<Sqlite>,
}

impl DeviceRepo {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }
    
    pub async fn get_device(&self) -> Result<Device> {
        sqlx::query_as!(Device, "SELECT * FROM device WHERE id = 1")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| e.into())
    }
    
    pub async fn create_device(&self, device: &Device) -> Result<()> {
        sqlx::query!(
            "INSERT INTO device (id, name, created_at) VALUES (?, ?, ?)",
            device.id,
            device.name,
            device.created_at
        )
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
}
```

### Service Layer Pattern

Services coordinate between repositories and provide business logic:

```rust
pub struct DeviceService {
    device_repo: DeviceRepo,
    device_profile_repo: DeviceProfileRepo,
}

impl DeviceService {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self {
            device_repo: DeviceRepo::new(pool.clone()),
            device_profile_repo: DeviceProfileRepo::new(pool),
        }
    }
    
    pub async fn initialize_device(&self) -> Result<Device> {
        // Business logic that coordinates multiple repositories
        let existing = self.device_repo.get_device().await;
        match existing {
            Ok(device) => Ok(device),
            Err(_) => {
                let new_device = Device::new();
                self.device_repo.create_device(&new_device).await?;
                Ok(new_device)
            }
        }
    }
}
```

### Migration Pattern

```rust
pub struct Migration {
    pub version: u32,
    pub description: String,
    pub sql: String,
    pub kind: MigrationKind,
}

pub enum MigrationKind {
    Ebb,
    Monitor,
}

pub async fn run_migrations(pool: &Pool<Sqlite>, kind: MigrationKind) -> Result<()> {
    let migrations = get_migrations_for_kind(kind);
    
    for migration in migrations {
        // Check if migration already applied
        // Execute migration
        // Record migration in schema_migrations table
    }
    
    Ok(())
}
```

## System Integration Patterns

### System Monitoring

```rust
// Singleton pattern for system monitoring
static MONITOR_RUNNING: AtomicBool = AtomicBool::new(false);
static MONITOR_APP_HANDLE: Mutex<Option<AppHandle>> = Mutex::new(None);

pub async fn start_system_monitoring(app_handle: AppHandle) -> Result<(), String> {
    if MONITOR_RUNNING.load(Ordering::SeqCst) {
        return Err("System monitoring is already running".to_string());
    }
    
    // Store app handle for event emission
    {
        let mut handle_guard = MONITOR_APP_HANDLE.lock().unwrap();
        *handle_guard = Some(app_handle.clone());
    }
    
    // Start monitoring in background thread
    tokio::spawn(async move {
        monitoring_loop(app_handle).await;
    });
    
    MONITOR_RUNNING.store(true, Ordering::SeqCst);
    Ok(())
}
```

### Event Emission Pattern

```rust
pub fn emit_event<T: serde::Serialize>(
    app_handle: &AppHandle,
    event_name: &str,
    payload: T,
) -> Result<()> {
    app_handle
        .emit(event_name, payload)
        .map_err(|e| {
            log::error!("Failed to emit event {}: {}", event_name, e);
            e.into()
        })
}

// Usage in monitoring loop
emit_event(&app_handle, "app-blocked", BlockedAppEvent {
    app_name: app.name,
    timestamp: Utc::now(),
})?;
```

## Window Management Patterns

### Custom Window Behavior

```rust
pub trait WebviewWindowExt {
    fn to_spotlight_panel(&self) -> tauri::Result<Panel>;
    fn center_top_of_cursor_monitor(&self) -> tauri::Result<()>;
}

impl<R: Runtime> WebviewWindowExt for WebviewWindow<R> {
    fn to_spotlight_panel(&self) -> tauri::Result<Panel> {
        // macOS-specific panel creation
        let panel = Panel::from(self.ns_window() as *mut std::ffi::c_void);
        panel.set_level(PanelLevel::ModalPanel);
        panel.set_collection_behavior(PanelCollectionBehavior::MoveToActiveSpace);
        Ok(panel)
    }
}
```

### Notification Windows

```rust
pub async fn show_notification(
    app_handle: AppHandle,
    notification_type: String,
    payload: Option<String>,
) -> Result<(), String> {
    let notification_url = get_notification_url(&notification_type, payload)?;
    
    let window = WebviewWindowBuilder::new(
        &app_handle,
        "notification",
        WebviewUrl::External(notification_url),
    )
    .title("Notification")
    .inner_size(400.0, 200.0)
    .resizable(false)
    .build()
    .map_err(|e| e.to_string())?;
    
    // Convert to spotlight panel for non-focus-stealing behavior
    window.to_spotlight_panel()
        .map_err(|e| e.to_string())?;
    
    Ok(())
}
```

## Error Handling Patterns

### Consistent Error Types

```rust
// Internal errors using thiserror
#[derive(thiserror::Error, Debug)]
pub enum DatabaseError {
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),
    #[error("Migration failed: {0}")]
    MigrationFailed(String),
    #[error("Query failed: {0}")]
    QueryFailed(#[from] sqlx::Error),
}

// Command errors (always String for Tauri)
pub fn to_command_error<E: std::error::Error>(e: E) -> String {
    e.to_string()
}
```

### Error Propagation

```rust
pub async fn complex_operation() -> Result<Data, DatabaseError> {
    let device = device_repo.get_device().await?; // Auto-conversion with ?
    let profile = device_profile_repo.get_profile(device.id).await?;
    
    // Business logic...
    
    Ok(processed_data)
}

// In Tauri commands
#[tauri::command]
pub async fn command_wrapper() -> Result<Data, String> {
    complex_operation()
        .await
        .map_err(|e| e.to_string()) // Convert to String for frontend
}
```

## Configuration Patterns

### Tauri Configuration

Key configuration in `tauri.conf.json`:

```json
{
  "plugins": {
    "shell": {
      "open": true
    },
    "sql": {
      "preload": ["sqlite:ebb-desktop.sqlite"]
    }
  },
  "bundle": {
    "resources": [
      "notifications/**/*",
      "fonts/**/*"
    ]
  }
}
```

### Runtime Configuration

```rust
// Environment-specific behavior
pub fn get_notification_url(
    notification_type: &str,
    payload: Option<String>,
) -> Result<Url, ParseError> {
    let base_url = if cfg!(debug_assertions) {
        "http://localhost:1420"
    } else {
        "tauri://localhost"
    };
    
    let mut url = Url::parse(&format!("{}/notification-{}.html", base_url, notification_type))?;
    
    if let Some(payload) = payload {
        url.query_pairs_mut().append_pair("payload", &payload);
    }
    
    Ok(url)
}
```

## Testing Patterns

### Unit Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;
    
    async fn setup_test_db() -> Pool<Sqlite> {
        SqlitePoolOptions::new()
            .connect(":memory:")
            .await
            .expect("Failed to create test database")
    }
    
    #[tokio::test]
    async fn test_device_creation() {
        let pool = setup_test_db().await;
        let repo = DeviceRepo::new(pool);
        
        let device = Device::new();
        repo.create_device(&device).await.unwrap();
        
        let retrieved = repo.get_device().await.unwrap();
        assert_eq!(device.id, retrieved.id);
    }
}
```

### Integration Testing

```rust
#[cfg(test)]
mod integration_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_full_device_workflow() {
        let db_manager = DatabaseManager::new().await.unwrap();
        let pool = db_manager.get_ebb_pool().await.unwrap();
        let service = DeviceService::new(pool);
        
        // Test complete workflow
        let device = service.initialize_device().await.unwrap();
        assert!(device.id > 0);
    }
}
```

## Key Dependencies

Essential crates used in this project:

- **Core**: `tauri`, `tokio`, `serde`, `serde_json`
- **Database**: `sqlx`, `uuid`, `chrono`
- **System**: `os-monitor`, `os-monitor-service`
- **macOS**: `tauri-nspanel`, `objc2-app-kit`
- **Utilities**: `dirs`, `log`, `thiserror`

## Architecture Best Practices

1. **Separation of Concerns**: Database logic in separate crate
2. **Error Handling**: Consistent error types with proper conversion
3. **Resource Management**: Connection pooling and proper cleanup
4. **Platform Integration**: Native system APIs for enhanced functionality
5. **Event-Driven**: Tauri events for real-time communication with frontend
6. **Testing**: Comprehensive unit and integration tests