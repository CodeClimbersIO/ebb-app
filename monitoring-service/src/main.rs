extern crate dotenv;
use std::{sync::Arc, time::Duration};

use dotenv::dotenv;
use monitoring_service::services::activities_service;

use tokio::{self, time::sleep};

#[tokio::main]
async fn main() {
    println!("starting activity service");
    dotenv().ok();
    let activity_service = Arc::new(activities_service::start_monitoring().await);

    let activity_state_interval = Duration::from_secs(30);

    activity_service.start_activity_state_loop(activity_state_interval);

    monitor::initialize_callback(activity_service.clone()).expect("Failed to initialize callback");

    // Wait for a few iterations
    tokio::time::sleep(Duration::from_millis(350)).await;

    loop {
        sleep(Duration::from_secs(1)).await;
        monitor::detect_changes().expect("Failed to detect changes");
    }
}
