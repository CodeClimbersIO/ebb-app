# Monitor

The monitor is a Rust application that runs on your computer and is responsible for monitoring your activities. It is specifically responsible for monitoring (but not recording) your window, mouse and keyboard activity.


## Getting Started

### Prerequisites

- Rust toolchain (install via [rustup](https://rustup.rs/))
- For macOS:
  - Xcode Command Line Tools
  - Accessibility permissions (will be prompted on first run)
- For Windows:
  - Visual Studio with C++ development tools
  - Windows SDK

### Building and Running

1. Clone the repository
2. Navigate to the monitor directory
3. Build the project:   ```bash
   cargo build   ```
4. Run the monitor:   ```bash
   cargo run   ```

On first run on macOS, you'll need to grant accessibility permissions to the application. This is required to monitor window focus and input events.

## Architecture Overview

### Core Components

1. **Event System**
   - `EventCallback` trait defines how events are handled
   - Three main event types:
     - `MouseEvent`: Tracks mouse movements, clicks, and scrolling
     - `KeyboardEvent`: Tracks keyboard activity (key codes only, not keystrokes)
     - `WindowEvent`: Tracks window focus changes and titles

2. **Platform-Specific Implementation**
   - Uses conditional compilation (`#[cfg(target_os = "...")]`) for platform-specific code
   - Separated into platform modules:
     - `platform/macos.rs`: macOS implementation
     - `platform/windows.rs`: Windows implementation

3. **Native Bindings**
   - Uses FFI to interface with native APIs
   - macOS: Objective-C code in `bindings/macos/`
   - Windows: Win32 API code in `bindings/windows/`

### Cross-Platform Design

The monitor achieves cross-platform compatibility through several layers:

1. **Common Interface Layer** (`src/monitor.rs`)
   - Defines platform-agnostic traits and types
   - `EventCallback` trait standardizes event handling

2. **Platform Abstraction** (`src/platform/mod.rs`)
   - Provides unified functions that delegate to platform-specific implementations
   - Key functions:
     - `detect_changes()`: Polls for new events
     - `initialize_callback()`: Sets up event monitoring

3. **Native Bindings** (`src/bindings.rs`)
   - Defines FFI interfaces for both platforms
   - Uses conditional compilation to select appropriate bindings

### Event Handling

1. **Event Collection**
   - Events are collected in batches (30-second intervals by default)
   - Uses thread-safe `AccumulatedEvents` structure
   - Events are stored in memory until batch interval is reached

2. **Event Processing**
   - Mouse events include position, event type, and scroll information
   - Keyboard events capture key codes only (not actual keystrokes)
   - Window events track application name and window title changes

3. **Callback System**
   - Implements the Observer pattern through `EventCallback`
   - Callbacks are thread-safe and can be shared across threads
   - Events are delivered in batches to reduce overhead

## Security and Privacy

- The monitor only tracks event metadata, not content
- No keystrokes are recorded, only key codes
- Window titles and application names are captured for context
- All data processing happens locally

## Development Guidelines

### Adding Platform Support

To add support for a new platform:

1. Create new platform-specific module in `src/platform/`
2. Implement native bindings in `bindings/`
3. Implement required traits and functions
4. Update conditional compilation flags