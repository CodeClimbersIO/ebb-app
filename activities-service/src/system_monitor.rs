extern crate dotenv;
use dotenv::dotenv;

use crate::{db::db_manager, ActivityService};

pub async fn start_monitoring() -> ActivityService {
    println!("monitoring starting");
    dotenv().ok();

    let db_path = db_manager::get_db_path();
    let db_manager = db_manager::DbManager::new(&db_path).await.unwrap();

    ActivityService::new(db_manager.pool)
}
