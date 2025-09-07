pub mod tide_service;
pub mod tide_scheduler;

use std::sync::Arc;
use thiserror::Error;
use tide_scheduler::{TideScheduler, TideSchedulerEvent, TideSchedulerError};
use tide_service::{TideService, TideServiceError};

#[derive(Error, Debug)]
pub enum TideManagerError {
    #[error("Service error: {0}")]
    Service(#[from] TideServiceError),
    #[error("Scheduler error: {0}")]
    Scheduler(#[from] TideSchedulerError),
    #[error("Manager already running")]
    AlreadyRunning,
    #[error("Manager not running")]
    NotRunning,
    #[error("Invalid operation: {message}")]
    InvalidOperation { message: String },
}

pub type Result<T> = std::result::Result<T, TideManagerError>;

/// TideManager handles lifecycle management activities for tides
/// This includes scheduling, automatic generation, and complex business workflows
pub struct TideManager {
    scheduler: Arc<TideScheduler>,
    service: Arc<TideService>,
}

impl TideManager {
    /// Create a new TideManager with default configuration (60 second intervals)
    pub async fn new() -> Result<Self> {
        Self::new_with_interval(60).await
    }

    /// Create a new TideManager with custom interval
    pub async fn new_with_interval(interval_seconds: u64) -> Result<Self> {
        let scheduler = Arc::new(TideScheduler::new(interval_seconds)?);
        let service = Arc::new(TideService::new().await?);
        
        Ok(Self {
            scheduler,
            service,
        })
    }

    /// Start the TideManager - begins listening to scheduler events
    pub async fn start(&self) -> Result<()> {
        // Start the scheduler (it manages its own running state)
        self.scheduler.start().await?;
        
        // Subscribe to scheduler events and handle them
        let mut receiver = self.scheduler.subscribe();
        let service = Arc::clone(&self.service);
        let scheduler = Arc::clone(&self.scheduler);
        
        tokio::spawn(async move {
            while scheduler.is_running() {
                match receiver.recv().await {
                    Ok(event) => {
                        if let Err(e) = Self::handle_scheduler_event(event, &service).await {
                            eprintln!("Error handling scheduler event: {}", e);
                        }
                    }
                    Err(tokio::sync::broadcast::error::RecvError::Closed) => {
                        // Scheduler closed, stop listening
                        break;
                    }
                    Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => {
                        // We're lagging behind, continue
                        eprintln!("TideManager is lagging behind scheduler events");
                        continue;
                    }
                }
            }
        });
        
        Ok(())
    }

    /// Stop the TideManager - delegates to scheduler
    pub fn stop(&self) -> Result<()> {
        self.scheduler.stop()?;
        Ok(())
    }

    /// Check if the TideManager is currently running - delegates to scheduler
    pub fn is_running(&self) -> bool {
        self.scheduler.is_running()
    }

    /// Handle scheduler events (private method)
    async fn handle_scheduler_event(
        event: TideSchedulerEvent,
        service: &TideService,
    ) -> Result<()> {
        match event {
            TideSchedulerEvent::Check { timestamp: _ } => {
                // Placeholder for tide lifecycle operations
                Self::perform_tide_check(service).await?;
            }
        }
        Ok(())
    }

    /// Perform tide lifecycle checks (placeholder implementation)
    async fn perform_tide_check(_service: &TideService) -> Result<()> {
        println!("Performing tide check...");
        Ok(())
    }
}