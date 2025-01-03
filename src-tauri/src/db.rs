use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_db_path() -> String {
    let home_dir = dirs::home_dir().expect("Could not find home directory");
    home_dir
        .join(".ebb")
        .join("ebb-desktop.sqlite")
        .to_str()
        .expect("Invalid path")
        .to_string()
}

pub fn get_migrations() -> Vec<Migration> {
    println!("get_migrations");
    vec![Migration {
        version: 1,
        description: "create_flow_session",
        sql: r#"
          CREATE TABLE IF NOT EXISTS flow_session (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              objective TEXT NOT NULL,
              self_score REAL NOT NULL,
              start DATETIME NOT NULL,
              end DATETIME NOT NULL
          );"#,
        kind: MigrationKind::Up,
    }]
}
