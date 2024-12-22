use monitor::EventCallback;
use std::sync::Arc;
use std::time::Duration;

use crate::services;

pub async fn get_callback() -> Arc<impl EventCallback> {
    let activity_service = Arc::new(services::activities_service::start_monitoring().await);

    let activity_state_interval = Duration::from_secs(30);
    activity_service.start_activity_state_loop(activity_state_interval);

    activity_service
}
