use monitor::{EventCallback, MonitorError};
use std::sync::Arc;
use std::time::Duration;

use crate::services;

static ACTIVITY_STATE_INTERVAL: Duration = Duration::from_secs(30); // every 30 seconds
static ACTIVITY_FLOW_PERIOD_INTERVAL: Duration = Duration::from_secs(60 * 10); // every 10 minutes

async fn get_callback() -> Arc<impl EventCallback> {
    let activity_service = Arc::new(services::activities_service::start_monitoring().await);

    activity_service.start_activity_state_loop(ACTIVITY_STATE_INTERVAL);

    activity_service.start_activity_flow_period_loop(ACTIVITY_FLOW_PERIOD_INTERVAL);

    activity_service
}

pub async fn initialize_monitor() {
    let callback = get_callback().await;
    monitor::initialize_callback(callback).expect("Failed to initialize callback")
}

pub fn detect_changes() -> Result<(), MonitorError> {
    monitor::detect_changes()
}
