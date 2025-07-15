-- Create user_notification table for tracking sent notifications
-- This ensures idempotency - we only send notifications once per user per type

CREATE TABLE IF NOT EXISTS user_notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('paid_user', 'new_user', 'inactive_user', 'weekly_report')),
  reference_id VARCHAR(255) NOT NULL, -- Unique identifier for this notification instance
  channel VARCHAR(50), -- Notification channel (discord, email, slack, sms)
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  data JSONB, -- Store additional notification metadata
  provider_result JSONB, -- Store result from notification provider
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_notification_user_id 
ON user_notification(user_id);

CREATE INDEX IF NOT EXISTS idx_user_notification_type 
ON user_notification(notification_type);

CREATE INDEX IF NOT EXISTS idx_user_notification_sent_at 
ON user_notification(sent_at);

-- Create unique index to prevent duplicate notifications for the same event/instance/channel
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_notification_unique 
ON user_notification(user_id, notification_type, reference_id, channel);

-- Create index for efficient channel-based queries
CREATE INDEX IF NOT EXISTS idx_user_notification_channel 
ON user_notification(user_id, notification_type, reference_id, channel);

-- Create index for notification type and channel
CREATE INDEX IF NOT EXISTS idx_user_notification_type_channel 
ON user_notification(notification_type, channel);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_notification_updated_at
    BEFORE UPDATE ON user_notification
    FOR EACH ROW
    EXECUTE FUNCTION update_user_notification_updated_at();

/*
-- ROLLBACK MIGRATION (uncomment to rollback)
-- Run these statements in reverse order to undo this migration:

-- DROP TRIGGER IF EXISTS update_user_notification_updated_at ON user_notification;
-- DROP FUNCTION IF EXISTS update_user_notification_updated_at();
-- DROP INDEX IF EXISTS idx_user_notification_type_channel;
-- DROP INDEX IF EXISTS idx_user_notification_channel;
-- DROP INDEX IF EXISTS idx_user_notification_unique;
-- DROP INDEX IF EXISTS idx_user_notification_sent_at;
-- DROP INDEX IF EXISTS idx_user_notification_type;
-- DROP INDEX IF EXISTS idx_user_notification_user_id;
-- DROP TABLE IF EXISTS user_notification;

-- Remove migration record to allow re-running the up migration
-- DELETE FROM supabase_migrations.schema_migrations WHERE version = '20250710010827';
*/



    