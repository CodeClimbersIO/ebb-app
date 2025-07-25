-- Slack Integration Database Schema
-- Add these tables to support Slack OAuth and integration features

-- Table to temporarily store OAuth state tokens (for security)
CREATE TABLE slack_oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_token TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient cleanup of expired tokens
CREATE INDEX idx_slack_oauth_states_expires_at ON slack_oauth_states(expires_at);

-- Table to track active focus sessions for cleanup and status reporting
CREATE TABLE slack_focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  duration_minutes INTEGER,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

-- Table to store Slack workspace integrations
CREATE TABLE slack_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT NOT NULL UNIQUE, -- Slack team/workspace ID
  team_name TEXT NOT NULL,
  team_domain TEXT,
  bot_token TEXT NOT NULL, -- Encrypted bot token
  bot_user_id TEXT NOT NULL, -- Bot user ID in the workspace
  app_id TEXT NOT NULL,
  scope TEXT NOT NULL, -- Granted scopes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Table to track per-workspace state for each focus session
CREATE TABLE slack_focus_session_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES slack_focus_sessions(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES slack_workspaces(id) ON DELETE CASCADE,
  status_updated BOOLEAN DEFAULT false,
  dnd_enabled BOOLEAN DEFAULT false,
  error_message TEXT,
  error_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, workspace_id)
);


-- Table to store user-specific Slack connections
CREATE TABLE slack_user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES slack_workspaces(id) ON DELETE CASCADE,
  slack_user_id TEXT NOT NULL, -- User's Slack ID in the workspace
  access_token TEXT NOT NULL, -- Encrypted user access token
  scope TEXT NOT NULL, -- User-granted scopes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workspace_id) -- One connection per user per workspace
);

-- Table to store Slack integration preferences per user
CREATE TABLE slack_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN DEFAULT false,
  auto_status_update BOOLEAN DEFAULT true, -- Auto-update status during focus
  auto_dnd BOOLEAN DEFAULT true, -- Auto-enable DND during focus
  custom_status_text TEXT DEFAULT 'Focusing with Ebb', -- Custom status message
  custom_status_emoji TEXT DEFAULT ':brain:', -- Custom status emoji
  auto_reply_enabled BOOLEAN DEFAULT true, -- Enable auto-replies
  auto_reply_message TEXT DEFAULT 'I''m currently in a focus session with Ebb. If this is urgent, please mark your message as such and I''ll get back to you as soon as possible.',
  urgent_keywords JSONB DEFAULT '["urgent", "emergency", "asap", "important"]'::jsonb, -- Keywords that bypass auto-reply
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to track focus session Slack activities (for analytics/debugging)
CREATE TABLE slack_session_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- Focus session identifier (if available)
  activity_type TEXT NOT NULL CHECK (activity_type IN ('status_set', 'status_cleared', 'dnd_enabled', 'dnd_disabled', 'auto_reply_sent', 'error')),
  slack_workspace_id UUID REFERENCES slack_workspaces(id),
  details JSONB, -- Additional activity details
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_slack_user_connections_user_id ON slack_user_connections(user_id);
CREATE INDEX idx_slack_user_connections_workspace_id ON slack_user_connections(workspace_id);
CREATE INDEX idx_slack_user_connections_active ON slack_user_connections(user_id, is_active);
CREATE INDEX idx_slack_preferences_user_id ON slack_preferences(user_id);
CREATE INDEX idx_slack_session_activities_user_id ON slack_session_activities(user_id);
CREATE INDEX idx_slack_session_activities_created_at ON slack_session_activities(created_at);
CREATE INDEX idx_slack_focus_sessions_user_id ON slack_focus_sessions(user_id);
CREATE INDEX idx_slack_focus_sessions_active ON slack_focus_sessions(user_id, is_active);
CREATE INDEX idx_slack_focus_sessions_start_time ON slack_focus_sessions(start_time);
CREATE INDEX idx_slack_focus_session_workspaces_session_id ON slack_focus_session_workspaces(session_id);
CREATE INDEX idx_slack_focus_session_workspaces_workspace_id ON slack_focus_session_workspaces(workspace_id);

-- Update triggers for updated_at timestamps
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON slack_workspaces
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON slack_user_connections
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON slack_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON slack_session_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON slack_oauth_states
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON slack_focus_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON slack_focus_session_workspaces
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE slack_oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_focus_session_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_session_activities ENABLE ROW LEVEL SECURITY;


-- ROLLBACK SCRIPT (commented out)
-- To undo these changes, uncomment and run the following statements:

-- DROP TRIGGER IF EXISTS set_updated_at ON slack_focus_session_workspaces;
-- DROP TRIGGER IF EXISTS set_updated_at ON slack_focus_sessions;
-- DROP TRIGGER IF EXISTS set_updated_at ON slack_oauth_states;
-- DROP TRIGGER IF EXISTS set_updated_at ON slack_session_activities;
-- DROP TRIGGER IF EXISTS set_updated_at ON slack_preferences;
-- DROP TRIGGER IF EXISTS set_updated_at ON slack_user_connections;
-- DROP TRIGGER IF EXISTS set_updated_at ON slack_workspaces;
-- DROP INDEX IF EXISTS idx_slack_focus_session_workspaces_workspace_id;
-- DROP INDEX IF EXISTS idx_slack_focus_session_workspaces_session_id;
-- DROP INDEX IF EXISTS idx_slack_focus_sessions_start_time;
-- DROP INDEX IF EXISTS idx_slack_focus_sessions_active;
-- DROP INDEX IF EXISTS idx_slack_focus_sessions_user_id;
-- DROP INDEX IF EXISTS idx_slack_session_activities_created_at;
-- DROP INDEX IF EXISTS idx_slack_session_activities_user_id;
-- DROP INDEX IF EXISTS idx_slack_preferences_user_id;
-- DROP INDEX IF EXISTS idx_slack_user_connections_active;
-- DROP INDEX IF EXISTS idx_slack_user_connections_workspace_id;
-- DROP INDEX IF EXISTS idx_slack_user_connections_user_id;
-- DROP INDEX IF EXISTS idx_slack_oauth_states_expires_at;
-- DROP TABLE IF EXISTS slack_focus_session_workspaces;
-- DROP TABLE IF EXISTS slack_focus_sessions;
-- DROP TABLE IF EXISTS slack_session_activities;
-- DROP TABLE IF EXISTS slack_preferences;
-- DROP TABLE IF EXISTS slack_user_connections;
-- DROP TABLE IF EXISTS slack_workspaces;
-- DROP TABLE IF EXISTS slack_oauth_states;

-- DELETE FROM supabase_migrations.schema_migrations WHERE version = '20250713160841';