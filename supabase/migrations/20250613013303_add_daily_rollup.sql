CREATE TABLE activity_day_rollup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    tag_name TEXT NOT NULL,
    total_duration_minutes INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, date, tag_name)
);

ALTER TABLE activity_day_rollup ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_activity_day_rollup_user_id ON activity_day_rollup(user_id);
CREATE INDEX idx_activity_day_rollup_date ON activity_day_rollup(date);
CREATE INDEX idx_activity_day_rollup_tag_name ON activity_day_rollup(tag_name);

CREATE TRIGGER set_updated_at_activity_day_rollup
    BEFORE UPDATE ON activity_day_rollup
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 




-- ROLLBACK
-- DROP TRIGGER IF EXISTS set_updated_at_activity_day_rollup ON activity_day_rollup;

-- DROP INDEX IF EXISTS idx_activity_day_rollup_tag_name;
-- DROP INDEX IF EXISTS idx_activity_day_rollup_date;
-- DROP INDEX IF EXISTS idx_activity_day_rollup_user_id;

-- DROP TABLE IF EXISTS activity_day_rollup;