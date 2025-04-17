use tauri::{AppHandle, Manager};
use image::{ImageBuffer, Rgba, ImageFormat};
use imageproc::drawing::draw_filled_rect_mut;
use imageproc::drawing::draw_text_mut;
use imageproc::rect::Rect;
use ab_glyph::Font;
use ab_glyph::FontArc;
use ab_glyph::PxScale;
use log::info;
use once_cell::sync::Lazy;
use std::io::Cursor;

// Load embedded font once
static FONT: Lazy<FontArc> = Lazy::new(|| {
    let font_data = include_bytes!("../fonts/SFMonoRegular.otf");
    FontArc::try_from_vec(font_data.to_vec()).expect("Failed to load embedded font")
});

#[tauri::command]
pub fn generate_timer_icon(
    app_handle: AppHandle,
    time_string: String,
    current_ms: f64,
    total_ms: f64,
) -> Result<Vec<u8>, String> {
    let scale_factor = app_handle
        .get_webview_window("main")
        .map(|w| w.scale_factor().unwrap_or(1.0))
        .unwrap_or(1.0);

    let font_arc = &*FONT;

    let base_width = 88.0;
    let base_height = 22.0;
    let base_font_size = 20.0;
    let base_padding = 4.0;

    let width = (base_width * scale_factor as f64).round() as u32;
    let height = (base_height * scale_factor as f64).round() as u32;
    let scale = PxScale::from((base_font_size * scale_factor as f64) as f32);
    let padding = (base_padding * scale_factor as f64).round() as i32;
    let background_green = Rgba([0u8, 200u8, 0u8, 100u8]);

    let text_color = Rgba([255u8, 255u8, 255u8, 255u8]);

    let mut img = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_pixel(width, height, Rgba([0, 0, 0, 0]));

    let percentage = if total_ms > 0.0 { (current_ms / total_ms).min(1.0).max(0.0) } else { 0.0 };
    info!("[Tray Icon Gen Simplified] Received current_ms: {}, total_ms: {}, Calculated percentage: {}", current_ms, total_ms, percentage);
    let fill_width = (percentage * width as f64).round() as u32;
    if fill_width > 0 {
        draw_filled_rect_mut(
            &mut img,
            Rect::at(0, 0).of_size(fill_width, height),
            background_green,
        );
    }

    let x_pos = padding;
    let y_pos = ((height as f32 - scale.y) / 2.0).round() as i32;

    info!(
        "[Tray Icon Draw] w: {}, h: {}, scale: {:?}, calculated x: {}, calculated y: {}",
        width, height, scale, x_pos, y_pos
    );

    draw_text_mut(&mut img, text_color, x_pos, y_pos, scale, font_arc, &time_string);

    let mut png_bytes: Vec<u8> = Vec::new();
    match img.write_to(&mut Cursor::new(&mut png_bytes), ImageFormat::Png) {
        Ok(_) => Ok(png_bytes),
        Err(e) => Err(format!("Failed to encode PNG: {}", e)),
    }
} 