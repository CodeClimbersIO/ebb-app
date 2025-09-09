use std::sync::Arc;
use std::time::Duration;
use tokio::sync::broadcast;
use tokio::time::{interval, Instant};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum TideSchedulerError {
    #[error("Scheduler is already running")]
    AlreadyRunning,
    #[error("Scheduler is not running")]
    NotRunning,
    #[error("Invalid interval: {0}")]
    InvalidInterval(String),
}

pub type Result<T> = std::result::Result<T, TideSchedulerError>;

/// Events emitted by the TideScheduler
#[derive(Debug, Clone)]
pub enum TideSchedulerEvent {
    /// Periodic check event - fired immediately on start and then at intervals
    Check { timestamp: Instant },
}

/// TideScheduler handles periodic event emission for tide lifecycle management
pub struct TideScheduler {
    interval_duration: Duration,
    sender: broadcast::Sender<TideSchedulerEvent>,
    is_running: Arc<std::sync::atomic::AtomicBool>,
}

impl TideScheduler {
    /// Create a new TideScheduler with the specified interval in seconds
    pub fn new(interval_seconds: u64) -> Result<Self> {
        if interval_seconds == 0 {
            return Err(TideSchedulerError::InvalidInterval(
                "Interval must be greater than 0".to_string(),
            ));
        }

        let (sender, _) = broadcast::channel(100); // Buffer for 100 events

        Ok(Self {
            interval_duration: Duration::from_secs(interval_seconds),
            sender,
            is_running: Arc::new(std::sync::atomic::AtomicBool::new(false)),
        })
    }

    /// Subscribe to scheduler events - returns a receiver
    pub fn subscribe(&self) -> broadcast::Receiver<TideSchedulerEvent> {
        self.sender.subscribe()
    }

    /// Start the scheduler - fires immediately and then at intervals
    pub async fn start(&self) -> Result<()> {
        if self.is_running.load(std::sync::atomic::Ordering::SeqCst) {
            return Err(TideSchedulerError::AlreadyRunning);
        }

        self.is_running.store(true, std::sync::atomic::Ordering::SeqCst);

        // Fire immediate event
        let immediate_event = TideSchedulerEvent::Check {
            timestamp: Instant::now(),
        };
        
        if let Err(_) = self.sender.send(immediate_event) {
            // No subscribers yet, which is fine
        }

        // Start interval timer
        let mut timer = interval(self.interval_duration);
        let sender = self.sender.clone();
        let is_running = self.is_running.clone();

        tokio::spawn(async move {
            while is_running.load(std::sync::atomic::Ordering::SeqCst) {
                timer.tick().await;
                
                let event = TideSchedulerEvent::Check {
                    timestamp: Instant::now(),
                };

                if let Err(_) = sender.send(event) {
                    // All receivers dropped, continue running
                }
            }
        });

        Ok(())
    }

    /// Stop the scheduler
    pub fn stop(&self) -> Result<()> {
        if !self.is_running.load(std::sync::atomic::Ordering::SeqCst) {
            return Err(TideSchedulerError::NotRunning);
        }

        self.is_running.store(false, std::sync::atomic::Ordering::SeqCst);
        Ok(())
    }

    /// Check if the scheduler is currently running
    pub fn is_running(&self) -> bool {
        self.is_running.load(std::sync::atomic::Ordering::SeqCst)
    }

    /// Get the current interval duration
    pub fn interval(&self) -> Duration {
        self.interval_duration
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::time::timeout;

    #[tokio::test]
    async fn test_scheduler_creation() -> Result<()> {
        let scheduler = TideScheduler::new(60)?;
        assert_eq!(scheduler.interval(), Duration::from_secs(60));
        assert!(!scheduler.is_running());
        Ok(())
    }

    #[tokio::test]
    async fn test_invalid_interval() {
        let result = TideScheduler::new(0);
        assert!(matches!(result, Err(TideSchedulerError::InvalidInterval(_))));
    }

    #[tokio::test]
    async fn test_subscription() -> Result<()> {
        let scheduler = TideScheduler::new(1)?;
        let receiver = scheduler.subscribe();
        
        // Receiver should be created successfully
        assert!(receiver.len() == 0);
        Ok(())
    }

    #[tokio::test]
    async fn test_start_and_immediate_event() -> Result<()> {
        let scheduler = TideScheduler::new(60)?;
        let mut receiver = scheduler.subscribe();
        
        scheduler.start().await?;
        assert!(scheduler.is_running());
        
        // Should receive immediate event
        let event = timeout(Duration::from_millis(100), receiver.recv()).await;
        assert!(event.is_ok());
        
        if let Ok(Ok(TideSchedulerEvent::Check { timestamp: _ })) = event {
            // Success - received the immediate check event
        } else {
            panic!("Expected immediate Check event");
        }
        
        scheduler.stop()?;
        Ok(())
    }

    #[tokio::test]
    async fn test_interval_events() -> Result<()> {
        let scheduler = TideScheduler::new(1)?; // 1 second interval for testing
        let mut receiver = scheduler.subscribe();
        
        scheduler.start().await?;
        
        // Should receive immediate event
        let immediate = timeout(Duration::from_millis(100), receiver.recv()).await;
        assert!(immediate.is_ok());
        
        // Should receive interval event after ~1 second
        let interval_event = timeout(Duration::from_millis(1200), receiver.recv()).await;
        assert!(interval_event.is_ok());
        
        scheduler.stop()?;
        Ok(())
    }

    #[tokio::test]
    async fn test_stop_scheduler() -> Result<()> {
        let scheduler = TideScheduler::new(60)?;
        
        scheduler.start().await?;
        assert!(scheduler.is_running());
        
        scheduler.stop()?;
        assert!(!scheduler.is_running());
        
        // Stopping again should return error
        assert!(matches!(scheduler.stop(), Err(TideSchedulerError::NotRunning)));
        
        Ok(())
    }

    #[tokio::test]
    async fn test_double_start() -> Result<()> {
        let scheduler = TideScheduler::new(60)?;
        
        scheduler.start().await?;
        
        // Starting again should return error
        let result = scheduler.start().await;
        assert!(matches!(result, Err(TideSchedulerError::AlreadyRunning)));
        
        scheduler.stop()?;
        Ok(())
    }

    #[tokio::test]
    async fn test_multiple_subscribers() -> Result<()> {
        let scheduler = TideScheduler::new(60)?;
        let mut receiver1 = scheduler.subscribe();
        let mut receiver2 = scheduler.subscribe();
        
        scheduler.start().await?;
        
        // Both receivers should get the immediate event
        let event1 = timeout(Duration::from_millis(100), receiver1.recv()).await;
        let event2 = timeout(Duration::from_millis(100), receiver2.recv()).await;
        
        assert!(event1.is_ok());
        assert!(event2.is_ok());
        
        scheduler.stop()?;
        Ok(())
    }
}