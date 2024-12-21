use std::env;
use std::path::PathBuf;

fn main() {
    println!("cargo:warning=Build script starting...");

    let target_os = env::var("CARGO_CFG_TARGET_OS").unwrap();
    println!("cargo:info=Target OS: {}", target_os);

    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
    println!("cargo:info=Manifest dir: {}", manifest_dir.display());

    if target_os == "macos" {
        println!("cargo:info=Building for macOS...");

        let source_files = [
            manifest_dir
                .join("bindings")
                .join("macos")
                .join("Monitor.m"),
            manifest_dir
                .join("bindings")
                .join("macos")
                .join("Monitor.h"),
        ];
        let output_dir = manifest_dir.join("bindings").join("macos");

        println!("cargo:info=Source files: {:?}", source_files);
        println!("cargo:info=Output directory: {}", output_dir.display());

        // Build the Objective-C code using clang
        println!("cargo:info=Compiling Objective-C code...");
        let status = std::process::Command::new("clang")
            .args(&[
                "-fobjc-arc", // Enable ARC
                "-fmodules",  // Enable modules
                "-framework",
                "Cocoa",                           // Link Cocoa framework
                "-dynamiclib",                     // Create dynamic library
                source_files[0].to_str().unwrap(), // Monitor.m
                "-I",
                source_files[1].parent().unwrap().to_str().unwrap(), // Include directory for Monitor.h
                "-o",
                output_dir.join("libMacMonitor.dylib").to_str().unwrap(),
            ])
            .status()
            .expect("Failed to execute clang command");

        if !status.success() {
            panic!("Objective-C compilation failed");
        }

        println!("cargo:info=Setting up library paths...");
        println!("cargo:rustc-link-search=native={}", output_dir.display());
        println!("cargo:rustc-link-lib=MacMonitor");

        // Link against required frameworks
        println!("cargo:rustc-link-lib=framework=Cocoa");
        println!("cargo:rustc-link-lib=framework=Foundation");

        // Tell Cargo to rerun if our Objective-C sources change
        for source_file in &source_files {
            println!("cargo:rerun-if-changed={}", source_file.display());
        }
    } else if target_os == "windows" {
        println!("cargo:info=Building for Windows...");

        let source_path = manifest_dir
            .join("bindings")
            .join("windows_monitor")
            .join("windows_monitor")
            .join("monitor.c");
        let output_dir = manifest_dir
            .join("bindings")
            .join("windows_monitor")
            .join("windows_monitor")
            .join("release");

        println!("cargo:info=Source path: {}", source_path.display());
        println!("cargo:info=Output directory: {}", output_dir.display());

        std::fs::create_dir_all(&output_dir).unwrap();

        // Compile the C code
        println!("cargo:info=Compiling C code...");
        cc::Build::new()
            .file(&source_path)
            .static_flag(false) // Not a static library
            .out_dir(&output_dir) // Specify where to put the output
            .compile("WindowsMonitor");

        println!("cargo:info=Setting up library paths...");
        println!("cargo:rustc-link-search=native={}", output_dir.display());
        println!("cargo:rustc-link-lib=WindowsMonitor");

        println!("cargo:rustc-link-lib=user32");

        // Tell Cargo to rerun if our source changes
        println!("cargo:rerun-if-changed={}", source_path.display());
        println!("cargo:warning=Build script completed successfully");
    }
}
