use backtrace::Backtrace;
use chrono::Local;
use colored::*;
use std::thread;
pub fn log(message: &str) {
    log_base(message, 0, "blue");
}

pub fn log_indent(message: &str, indent: usize, color: &str) {
    log_base(message, indent, color);
}

fn get_caller_function() -> String {
    let bt = Backtrace::new();

    let frames = bt.frames();
    for frame in frames.iter().skip(7) {
        if let Some(sym) = frame.symbols().first() {
            if let Some(name) = sym.name() {
                let name = name.to_string();
                // Filter out some common runtime frames
                if !name.starts_with("std::") && !name.starts_with("core::") {
                    // Extract everything after the last :: and before any hash
                    let name_iter = name.split("::");
                    let func_name = name_iter.skip(1).next();
                    if let Some(clean_name) = func_name {
                        return clean_name.to_string();
                    }
                    return name;
                }
            }
        }
    }
    "unknown".to_string()
}

pub fn log_base(message: &str, indent: usize, color: &str) {
    let thread_name = thread::current().name().unwrap_or("unnamed").to_string();
    let indent = "  ".repeat(indent);
    let caller = get_caller_function();
    let prefix = format!("{}-{}", thread_name, caller);
    let current_time = Local::now().format("%Y-%m-%d %H:%M:%S");
    let colored_prefix = match color.to_lowercase().as_str() {
        "red" => prefix.red(),
        "green" => prefix.green(),
        "yellow" => prefix.yellow(),
        "blue" => prefix.blue(),
        "magenta" => prefix.magenta(),
        "cyan" => prefix.cyan(),
        _ => prefix.blue(), // default to blue if color is not recognized
    };
    println!(
        "[{}]{}{}: {}",
        current_time, indent, colored_prefix, message
    );
}
