mod db;
use tokio;

#[tokio::main]
async fn main() {
    println!("starting activity service");
    let db_path = db::db_manager::get_db_path();
    let db_manager = db::db_manager::DbManager::new(&db_path).await.unwrap();
    let result: Result<i32, _> = sqlx::query_scalar("SELECT 1")
        .fetch_one(&db_manager.pool)
        .await;
    println!("{:?}", result);
}
