extern crate dotenv;
use db::models::Activity;
use dotenv::dotenv;

mod db;
mod services;
mod window_monitor;
use monitor::WindowEvent;
use services::activity_service::ActivityService;
use tokio;
use window_monitor::start_monitoring;

#[tokio::main]
async fn main() {
    println!("starting activity service");
    dotenv().ok();
    let db_path = db::db_manager::get_db_path();
    let db_manager = db::db_manager::DbManager::new(&db_path).await.unwrap();
    let result: Result<i32, _> = sqlx::query_scalar("SELECT 1")
        .fetch_one(&db_manager.pool)
        .await;

    let activity_service = ActivityService::new(db_manager.pool);
    let activity = Activity::create_window_activity(&WindowEvent {
        app_name: "Cursor".to_string(),
        title: "main.rs - app-codeclimbers".to_string(),
    });
    activity_service.save_activity(&activity).await.unwrap();
    start_monitoring();
    println!("{:?}", result);
}
