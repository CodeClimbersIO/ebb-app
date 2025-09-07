pub mod tide_service;
pub mod tide_scheduler;

use thiserror::Error;

#[derive(Error, Debug)]
pub enum TideManagerError {
    #[error("Service error: {0}")]
    Service(#[from] tide_service::TideServiceError),
    #[error("Invalid operation: {message}")]
    InvalidOperation { message: String },
}

pub type Result<T> = std::result::Result<T, TideManagerError>;

pub struct TideManager {
    // Will be populated with lifecycle management functionality later
}

impl TideManager {
    /// Create a new TideManager
    pub async fn new() -> Result<Self> {
        Ok(Self {
            // Placeholder for now
        })
    }
}