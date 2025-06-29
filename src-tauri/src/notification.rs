use crate::window::WebviewWindowExt;
use tauri::{AppHandle, Manager, Runtime};

pub const NOTIFICATION_WINDOW_LABEL: &str = "notification";
use tauri_nspanel::{
    objc_id::{Id, Shared},
    raw_nspanel::RawNSPanel,
    ManagerExt,
};

use url::{ParseError, Url};

pub fn get_notification_url(notification_type: &str) -> Result<Url, ParseError> {
    let params = &[
        ("window", "notification"),
        ("notification_type", notification_type),
    ];
    println!("params: {:?}", params);
    if cfg!(dev) {
        Url::parse_with_params("http://localhost:1420", params)
    } else {
        Url::parse_with_params("tauri://localhost/index.html", params)
    }
}

pub fn show_notification_window(
    panel: Id<RawNSPanel, Shared>,
    notification_type: &str,
) -> tauri::Result<()> {
    let Ok(notification_url) = get_notification_url(notification_type) else {
        log::error!("Failed to get notification URL");
        return Err(tauri::Error::WindowNotFound);
    };
    println!("notification_url: {:?}", notification_url);
    let Ok(_) = panel.navigate(notification_url) else {
        log::error!("Failed to navigate to notification URL");
        return Err(tauri::Error::WindowNotFound);
    };
    panel.show();
    return Ok(());
}

pub fn create_notification_window<R: Runtime>(
    app: &AppHandle<R>,
    notification_type: &str,
) -> tauri::Result<()> {
    let app_handle = app.app_handle();

    if let Ok(panel) = app_handle.get_webview_panel(NOTIFICATION_WINDOW_LABEL) {
        show_notification_window(panel, notification_type)?;
        return Ok(());
    }

    let params = format!(
        "?window=notification&notification_type={}",
        notification_type
    );
    // Create a notification window programmatically using WebviewWindowBuilder
    let notification_url = if cfg!(dev) {
        tauri::WebviewUrl::External(format!("http://localhost:1420{}", params).parse().unwrap())
    } else {
        tauri::WebviewUrl::App(format!("index.html#{}", params).into())
    };

    let notification_window =
        tauri::WebviewWindowBuilder::new(app_handle, "notification", notification_url)
            .title("Notification Window")
            .inner_size(376.0, 60.0)
            .position(0.0, 50.0)
            .transparent(true)
            .decorations(false)
            .shadow(false)
            .resizable(false)
            .visible(false) // Start hidden, show when needed
            .build();

    // Handle the result properly following the user's preference to avoid unwrap()
    match notification_window {
        Ok(window) => {
            println!(
                "Successfully created notification window: {}",
                window.label()
            );
        }
        Err(err) => {
            eprintln!("Failed to create notification window: {}", err);
            return Err(err);
        }
    }

    let notification_window = app_handle
        .get_webview_window(NOTIFICATION_WINDOW_LABEL)
        .unwrap();

    // Convert the window to a spotlight panel
    let panel = notification_window.to_spotlight_panel()?;

    notification_window.center_top_of_cursor_monitor()?;
    panel.show();

    Ok(())
}

pub fn dismiss_notification_window<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let app_handle = app.app_handle();
    let notification_window = app_handle
        .get_webview_window(NOTIFICATION_WINDOW_LABEL)
        .unwrap();
    // let panel = notification_window.to_spotlight_panel()?;
    // panel.order_out(None);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_notification_url() {
        let url = get_notification_url("smart-session-start").unwrap();
        assert_eq!(
            url.to_string(),
            "http://localhost:1420/?window=notification&notification_type=smart-session-start"
        );
    }
}
