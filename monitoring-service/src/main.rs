extern crate dotenv;
use std::{sync::Arc, time::Duration};

use dotenv::dotenv;
use monitoring_service::services::activities_service;

mod db;
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
