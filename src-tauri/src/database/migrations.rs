use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![
        // Define your migrations here
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: r#"
                CREATE TABLE IF NOT EXISTS activities_pulse (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                user_id          text not null,
                entity           text not null,
                type             varchar(255),
                category         varchar(255),
                project          text,
                branch           text,
                language         text,
                is_write         boolean,
                editor           text,
                operating_system text,
                machine          text,
                user_agent       varchar(255),
                time             timestamp(3),
                hash             varchar(17) UNIQUE,
                origin           varchar(255),
                origin_id        varchar(255),
                created_at       timestamp(3),
                description      text
              );
            "#,
            kind: MigrationKind::Up,
        },
    ]
}
