extern crate dotenv;
use std::time::Duration;

use dotenv::dotenv;

use monitoring_service::get_callback;
use tokio::{self, time::sleep};

#[tokio::main]
async fn main() {
    println!("starting activity service");
    dotenv().ok();

    let callback = get_callback().await;
    monitor::initialize_callback(callback).expect("Failed to initialize callback");

    tokio::time::sleep(Duration::from_millis(350)).await;

    loop {
        sleep(Duration::from_secs(1)).await;
        monitor::detect_changes().expect("Failed to detect changes");
    }
}
