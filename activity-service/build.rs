fn main() {
    println!("cargo:rerun-if-changed=migrations/");

    // Run SQLx migrations
    let result = std::process::Command::new("sqlx")
        .args(["database", "create"])
        .status()
        .and_then(|_| {
            std::process::Command::new("sqlx")
                .args(["migrate", "run"])
                .status()
        });

    if let Err(e) = result {
        panic!("Error running SQLx migrations: {}", e);
    }
}
