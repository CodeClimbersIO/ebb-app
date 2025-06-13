CREATE TABLE activity_day_rollup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    tag_name TEXT NOT NULL,
    total_duration_seconds INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure one stat per user per day per tag
    UNIQUE(user_id, date, tag_name)
);

-- Add indexes for efficient querying
CREATE INDEX idx_user_activity_stats_user_id ON activity_day_rollup(user_id);
CREATE INDEX idx_user_activity_stats_date ON activity_day_rollup(date);
CREATE INDEX idx_user_activity_stats_tag_id ON activity_day_rollup(tag_name);

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at_activity_day_rollup
    BEFORE UPDATE ON activity_day_rollup
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 