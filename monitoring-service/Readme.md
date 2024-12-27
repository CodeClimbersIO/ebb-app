# Monitoring Service

The monitoring service is a Rust application that runs as a background service to record user activity data. It works in conjunction with the [monitor](../monitor) crate to track and store activity metrics while maintaining user privacy.

## Overview

The monitoring service:
1. Receives activity events from the monitor crate
2. Processes and aggregates these events
3. Stores activity data in a SQLite database
4. Tracks activity states and context switches

## Getting Started

### Prerequisites

- Rust toolchain (install via [rustup](https://rustup.rs/))
- SQLite
- The [monitor](../monitor) crate built and available

### Building and Running

1. Clone the repository
2. Navigate to the monitoring-service directory
3. Install the SQLx CLI:
   ```bash
   cargo install sqlx-cli
   ```

4. Create and run migrations:
   ```bash
   # Run all pending migrations
   sqlx migrate run

   ```

5. Build the project:
   ```bash
   cargo build   ```
6. Run the service:   ```bash
   cargo watch -x run  ```

Refer to `main.rs` for more information on how the service is run.
The service will create a SQLite database at `~/.codeclimbers/codeclimbers-desktop.sqlite`

## Architecture

### Event Flow

1. Monitor crate detects activity and sends events
2. `ActivityService` receives events via callbacks
3. Events are processed and stored in batches
4. Activity states are updated every 30 seconds
5. App switches are tracked and aggregated
6. Activity flow periods are calculated and stored every 10 minutes

### Core Components

1. **Activity Service** (`services/activities_service.rs`)
   - Implements the `EventCallback` trait from the monitor crate
   - Processes incoming events (mouse, keyboard, window)
   - Manages activity state transitions
   - Handles batch processing of events

2. **App Switch Tracking** (`services/app_switch.rs`)
   - Tracks application switches
   - Implements debouncing to prevent rapid switching from skewing metrics
   - Maintains app switch counts for activity states

3. **Database Layer** (`db/`)
   - `ActivityRepo`: Handles storage of individual activities
   - `ActivityStateRepo`: Manages activity state records
   - `ActivityFlowPeriodRepo`: Manages activity flow period records
   - Uses SQLx for type-safe database operations

### Data Models

1. **Activity** (`db/models/activity.rs`)
   - Types: Keyboard, Mouse, Window
   - Stores metadata about user actions
   - Timestamps for event occurrence

2. **Activity State** (`db/models/activity_state.rs`)
   - Represents periods of user activity/inactivity
   - Tracks app switches within time periods
   - Types: Active, Inactive

3. **Activity Flow Period** (`db/models/activity_flow_period.rs`)
   - Records 10-minute activity periods
   - Provides a score for the period based on activity states and app switches
   - Maintains start/end times



## Privacy and Security

- No keystroke content is recorded
- Only activity metadata is stored
- All data remains local to the user's machine
- Database is stored in user's home directory

## Development

### Database Development

The project uses SQLx for type-safe database operations. When making changes to queries:

1. Ensure the database is running with the latest migrations
2. Update or create new queries in the code
3. Run SQLx prepare to check query compatibility:
cargo sqlx prepare -- --lib   ```bash
   
   ```

This will verify all SQL queries at compile time and update `sqlx-data.json`.

#### Working with Migrations

Migrations are stored in `migrations/` and follow the format:
```sql
-- Add migration script here
CREATE TABLE activity (
    id INTEGER PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    timestamp DATETIME,
    activity_type TEXT,
    app_name TEXT,
    app_window_title TEXT
);
```

To create a new migration:
1. Use `sqlx migrate add` to create the file
2. Add your SQL commands
3. Test the migration locally
4. Commit both the migration file and updated `sqlx-data.json`

### Running Tests

The project includes unit tests, integration tests, and database tests. It is not comprehensive. To run them:

```bash
# Run all tests
cargo test

# Run tests with output
cargo test -- --nocapture

# Run specific test
cargo test test_name

# Run tests in a specific module
cargo test module_name::
```

#### Test Organization

- **Unit Tests**: Located alongside the code they test
  ```rust
  #[cfg(test)]
  mod tests {
      use super::*;
      // test cases...
  }
  ```

- **Database Tests**: Use in-memory SQLite database
  - Located in `db/` modules
  - Automatically create and migrate test database
  - Clean up after each test

#### Writing Tests

1. **Activity Tests**
   ```rust
   #[tokio::test]
   async fn test_activity_creation() {
       let pool = create_test_db().await;
       let activity_service = ActivityService::new(pool);
       // Test logic...
   }
   ```


