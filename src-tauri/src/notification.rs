use crate::window::WebviewWindowExt;
use tauri::{AppHandle, Manager, Runtime, WebviewWindow};

pub const NOTIFICATION_WINDOW_LABEL: &str = "notification";
use tauri_nspanel::{
    objc_id::{Id, Shared},
    raw_nspanel::RawNSPanel,
    ManagerExt,
};

use url::{ParseError, Url};

pub fn get_notification_url(
    notification_type: &str,
    payload: Option<String>,
) -> Result<Url, ParseError> {
    println!(
        "get_notification_url called with type: {}, payload: {:?}",
        notification_type, payload
    );
    let base_url = if cfg!(dev) {
        "http://localhost:1420/notification.html"
    } else {
        "tauri://localhost/notification.html"
    };

    let mut url = Url::parse(base_url)?;
    url.query_pairs_mut()
        .append_pair("notification_type", notification_type);

    if let Some(payload_data) = payload {
        url.query_pairs_mut().append_pair("payload", &payload_data);
    }

    println!("final url: {:?}", url);
    Ok(url)
}

pub fn show_notification_window<R: Runtime>(
    notification_window: WebviewWindow<R>,
    panel: Id<RawNSPanel, Shared>,
    notification_type: &str,
    payload: Option<String>,
) -> tauri::Result<()> {
    let Ok(notification_url) = get_notification_url(notification_type, payload) else {
        log::error!("Failed to get notification URL");
        return Err(tauri::Error::WindowNotFound);
    };
    println!("notification_url: {:?}", notification_url);
    let Ok(_) = notification_window.navigate(notification_url) else {
        log::error!("Failed to navigate to notification URL");
        return Err(tauri::Error::WindowNotFound);
    };

    notification_window.center_top_of_cursor_monitor()?;

    // Configure panel to not steal focus

    // panel.set_becomes_key_only_if_needed(true);
    // panel.set_hides_on_deactivate(false);

    // Don't show immediately - wait for notification_ready call
    panel.show();
    return Ok(());
}

pub fn get_notification_window_and_panel<R: Runtime>(
    app: &AppHandle<R>,
) -> tauri::Result<(WebviewWindow<R>, Id<RawNSPanel, Shared>)> {
    let app_handle = app.app_handle();
    let Some(notification_window) = app_handle.get_webview_window(NOTIFICATION_WINDOW_LABEL) else {
        log::error!("No notification window found");
        return Err(tauri::Error::WindowNotFound);
    };
    let Ok(panel) = app_handle.get_webview_panel(NOTIFICATION_WINDOW_LABEL) else {
        log::error!("Failed to convert notification window to spotlight panel");
        return Err(tauri::Error::WindowNotFound);
    };
    Ok((notification_window, panel))
}

pub fn create_notification_window<R: Runtime>(
    app: &AppHandle<R>,
    notification_type: &str,
    payload: Option<String>,
) -> tauri::Result<()> {
    let app_handle = app.app_handle();

    if let Ok((notification_window, panel)) = get_notification_window_and_panel(app) {
        show_notification_window(
            notification_window,
            panel,
            notification_type,
            payload.clone(),
        )?;
        return Ok(());
    }

    let mut params = format!("?notification_type={}", notification_type);
    if let Some(payload_data) = payload {
        // Use simple URL encoding for the payload
        let encoded_payload = payload_data
            .replace("&", "%26")
            .replace("=", "%3D")
            .replace(" ", "%20");
        params.push_str(&format!("&payload={}", encoded_payload));
    }

    // Create a notification window programmatically using WebviewWindowBuilder

    // sometime the escape button works...
    let notification_url = if cfg!(dev) {
        tauri::WebviewUrl::External(
            format!("http://localhost:1420/notification.html{}", params)
                .parse()
                .unwrap(),
        )
    } else {
        // For release builds, use the same tauri:// protocol as in get_notification_url
        tauri::WebviewUrl::External(
            format!("tauri://localhost/notification.html{}", params)
                .parse()
                .unwrap(),
        )
    };

    let notification_window =
        tauri::WebviewWindowBuilder::new(app_handle, "notification", notification_url)
            .title("Notification Window")
            .inner_size(450.0, 100.0)
            .position(0.0, 50.0)
            .transparent(true)
            .decorations(false)
            .shadow(false)
            .resizable(false)
            .visible(false)
            // Start hidden, show when needed
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

    show_notification_window(notification_window, panel, notification_type, None)?;

    Ok(())
}

pub fn dismiss_notification_window<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let Ok((_, panel)) = get_notification_window_and_panel(app) else {
        log::error!("Failed to get notification window and panel");

        return Err(tauri::Error::WindowNotFound);
    };
    panel.order_out(None);
    println!("dismissing notification window");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_notification_url_without_payload() {
        let url = get_notification_url("smart-session-start", None).unwrap();
        assert_eq!(
            url.to_string(),
            "http://localhost:1420/notification.html?notification_type=smart-session-start"
        );
    }

    #[test]
    fn test_get_notification_url_with_payload() {
        let payload = r#"{"timeCreating": 1500, "percentage": 75}"#;
        let url = get_notification_url("session-end", Some(payload.to_string())).unwrap();
        assert!(url.to_string().contains("notification_type=session-end"));
        assert!(url.to_string().contains("payload="));
    }
}
