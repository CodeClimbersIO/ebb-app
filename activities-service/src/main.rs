extern crate dotenv;
use db::models::Activity;
use dotenv::dotenv;

mod db;
mod services;
use monitor::WindowEvent;
use services::activity_service::ActivityService;
mod system_monitor;
use tokio;

#[tokio::main]
async fn main() {
    println!("starting activity service");
    dotenv().ok();
    system_monitor::start_monitoring();
}
