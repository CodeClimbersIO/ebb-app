extern crate dotenv;
use dotenv::dotenv;

mod db;
mod services;
use services::activity_service::ActivityService;
mod system_monitor;
use tokio;

#[tokio::main]
async fn main() {
    println!("starting activity service");
    dotenv().ok();
    system_monitor::start_monitoring().await;
}
