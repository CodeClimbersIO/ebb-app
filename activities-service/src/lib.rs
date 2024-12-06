mod db;
mod services;
mod window_monitor;

pub use db::db_manager::DbManager;
pub use services::activity_service::ActivityService;
pub use window_monitor::start_monitoring;
