extern crate dotenv;
use std::time::Duration;

use dotenv::dotenv;

use monitoring_service::{detect_changes, initialize_monitor};
use tokio::{self, time::sleep};

#[tokio::main]
async fn main() {
    println!("starting activity service");
    dotenv().ok();

    initialize_monitor().await;

    tokio::time::sleep(Duration::from_millis(350)).await;

    loop {
        sleep(Duration::from_secs(1)).await;
        detect_changes().expect("Failed to detect changes");
    }
}
