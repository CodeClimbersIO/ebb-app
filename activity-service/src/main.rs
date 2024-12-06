extern crate dotenv;
use db::models::Activity;
use dotenv::dotenv;

mod db;
mod services;
use tokio;
#[tokio::main]
async fn main() {
    println!("starting activity service");
    dotenv().ok();
    let db_path = db::db_manager::get_db_path();
    let db_manager = db::db_manager::DbManager::new(&db_path).await.unwrap();
    let result: Result<i32, _> = sqlx::query_scalar("SELECT 1")
        .fetch_one(&db_manager.pool)
        .await;

    let activity_service = services::activity_service::ActivityService::new(db_manager);
    let activity = Activity::__create_test_window();
    activity_service.save_activity(&activity).await.unwrap();
    println!("{:?}", result);
}
