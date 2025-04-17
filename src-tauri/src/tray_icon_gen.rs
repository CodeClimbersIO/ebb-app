use tauri::{AppHandle, Manager};
use once_cell::sync::Lazy;
use std::io::Cursor;
use ril::prelude::*;
use ril::text::{Font, TextLayout, VerticalAnchor, TextSegment};

static FONT: Lazy<Font> = Lazy::new(|| {
    let font_data = include_bytes!("../fonts/SFMonoRegular.otf");
    Font::from_bytes(font_data, 16.0).expect("Failed to load embedded font")
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

    let font: &Font = &*FONT;

    let base_width = 88.0;
    let base_height = 22.0;
    let base_font_size = 16.0;
    let base_padding = 4.0;

    let width = (base_width * scale_factor as f64).round() as u32;
    let height = (base_height * scale_factor as f64).round() as u32;
    let font_size = (base_font_size * scale_factor as f64) as f32;
    let padding = (base_padding * scale_factor as f64).round() as u32;
    let background_green = Rgba::new(0u8, 200u8, 0u8, 100u8);

    let text_color = Rgba::new(255u8, 255u8, 255u8, 255u8);

    let mut img = Image::new(width, height, Rgba::new(0, 0, 0, 0));

    let percentage = if total_ms > 0.0 { (current_ms / total_ms).min(1.0).max(0.0) } else { 0.0 };
    let fill_width = (percentage * width as f64).round() as u32;
    if fill_width > 0 {
        let rect = Rectangle::<Rgba>::at(0, 0)
                    .with_size(fill_width, height)
                    .with_fill(background_green);
        img.draw(&rect);
    }

    let layout = TextLayout::new()
        .with_vertical_anchor(VerticalAnchor::Center)
        .with_position(padding, height / 2)
        .with_segment(
            &TextSegment::new(font, &time_string, text_color)
                .with_size(font_size)
        );

    img.draw(&layout);

    let mut png_bytes: Vec<u8> = Vec::new();
    match img.encode(ImageFormat::Png, &mut Cursor::new(&mut png_bytes)) {
        Ok(_) => Ok(png_bytes),
        Err(e) => Err(format!("Failed to encode PNG using ril: {}", e)),
    }
} 