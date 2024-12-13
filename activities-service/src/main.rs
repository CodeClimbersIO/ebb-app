extern crate dotenv;
use std::{sync::Arc, time::Duration};

use dotenv::dotenv;

mod db;
mod services;
use services::activity_service::ActivityService;
mod system_monitor;
use tokio::{self, time::sleep};

#[tokio::main]
async fn main() {
    println!("starting activity service");
    dotenv().ok();
    let activity_service = Arc::new(activities_service::start_monitoring().await);
    monitor::initialize_callback(activity_service.clone()).expect("Failed to initialize callback");
    loop {
        sleep(Duration::from_secs(1)).await;
        monitor::detect_changes().expect("Failed to detect changes");
    }
}
