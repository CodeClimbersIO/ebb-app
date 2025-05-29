-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

SELECT cron.schedule(
  'update-offline-users-sql',
  '*/10 * * * *',
  $$
  UPDATE user_profile
  SET 
    online_status = 'offline',
    last_check_in = NOW()
  WHERE 
    last_check_in < NOW() - INTERVAL '5 minutes'
    AND online_status != 'offline';
  $$
);


-- rollback 
-- SELECT cron.unschedule('update-offline-users-sql');
-- DELETE FROM supabase_migrations.schema_migrations WHERE version = '20250523220648';