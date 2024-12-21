#[derive(Debug)]
pub enum MonitorError {
    AlreadyRunning,
    NotRunning,
    PlatformError(String),
    ForeignException(String),
}

impl std::fmt::Display for MonitorError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MonitorError::AlreadyRunning => write!(f, "Monitor is already running"),
            MonitorError::NotRunning => write!(f, "Monitor is not running"),
            MonitorError::PlatformError(msg) => write!(f, "Platform error: {}", msg),
            MonitorError::ForeignException(msg) => write!(f, "Foreign exception: {}", msg),
        }
    }
}

impl std::error::Error for MonitorError {}
