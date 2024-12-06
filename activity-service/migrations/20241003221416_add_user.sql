CREATE TABLE IF NOT EXISTS accounts_user (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  email             varchar(255) UNIQUE,
  first_name        varchar(255),
  last_name         varchar(255),
  avatar_url        varchar(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts_user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id INTEGER NOT NULL,
  weekly_report_type VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES accounts_user (id) ON DELETE CASCADE
);
