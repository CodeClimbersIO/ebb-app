INSERT INTO accounts_user (email, first_name, last_name, avatar_url)
SELECT NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM accounts_user);

INSERT INTO accounts_user_settings (user_id)
SELECT id FROM accounts_user
WHERE id NOT IN (SELECT user_id FROM accounts_user_settings);