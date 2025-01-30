use os_monitor::Monitor;
use std::sync::Arc;
use std::time::Duration;

use crate::services;

static ACTIVITY_STATE_INTERVAL: Duration = Duration::from_secs(30); // every 30 seconds

pub async fn initialize_monitoring_service(monitor: Arc<Monitor>) {
    let activity_service = Arc::new(services::activities_service::start_monitoring().await);
    activity_service.register_callbacks(&monitor);
    activity_service.start_activity_state_loop(ACTIVITY_STATE_INTERVAL);
}
