use std::env;
use std::fs;
use std::path::{Path, PathBuf};

fn main() {
    // Only run this code when building for macOS
    #[cfg(target_os = "macos")]
    {
        // Get the output directory where Cargo will place the build artifacts
        let out_dir = env::var("OUT_DIR").unwrap();
        let out_path = Path::new(&out_dir);

        // Navigate up to find the target/release directory
        // OUT_DIR is typically something like target/release/build/your-crate-hash/out
        let target_release_dir = out_path
            .ancestors()
            .find(|p| p.ends_with("release") || p.ends_with("debug"))
            .expect("Could not find target release directory");

        // Find the os-monitor build directory
        let build_dir = target_release_dir.join("build");
        if build_dir.exists() {
            let entries = fs::read_dir(&build_dir).expect("Failed to read build directory");

            // Find directories that start with "os-monitor-"
            let mut os_monitor_dirs: Vec<PathBuf> = entries
                .filter_map(Result::ok)
                .filter(|entry| {
                    let file_name = entry.file_name();
                    let file_name_str = file_name.to_string_lossy();
                    file_name_str.starts_with("os-monitor-")
                        && !file_name_str.starts_with("os-monitor-service")
                        && entry.path().join("out").exists()
                })
                .map(|entry| entry.path().join("out"))
                .collect();

            if !os_monitor_dirs.is_empty() {
                // Sort by modification time (newest first)
                os_monitor_dirs.sort_by(|a, b| {
                    let a_meta = fs::metadata(a).unwrap();
                    let b_meta = fs::metadata(b).unwrap();
                    b_meta.modified().unwrap().cmp(&a_meta.modified().unwrap())
                });

                let latest_build_dir = &os_monitor_dirs[0];
                let dylib_path = latest_build_dir.join("libMacMonitor.dylib");

                if dylib_path.exists() {
                    // Copy the dylib to the target directory
                    let target_dir = target_release_dir.parent().unwrap();
                    let dest_path = target_dir.join("libMacMonitor.dylib");
                    fs::copy(&dylib_path, &dest_path).expect("Failed to copy libMacMonitor.dylib");

                    println!(
                        "cargo:warning=Successfully copied libMacMonitor.dylib to target directory"
                    );
                    // print out the full path to the copied dylib
                    println!("cargo:warning=Copied dylib to: {}", dest_path.display());

                    // Tell Cargo to link with rpath for the dev build
                    println!("cargo:rustc-link-arg=-Wl,-rpath,@executable_path");
                    println!("cargo:rustc-link-arg=-Wl,-rpath,@loader_path");

                    // Tell Cargo to re-run this build script if the dylib changes
                    println!("cargo:rerun-if-changed={}", dylib_path.display());
                } else {
                    panic!("Could not find libMacMonitor.dylib in the build directory");
                }
            } else {
                panic!("Could not find os-monitor build directory");
            }
        } else {
            panic!("Build directory does not exist. Make sure to build the project first.");
        }
    }
    tauri_build::build();
    // Tell Cargo that if the build script itself changes, it should be re-run
}
