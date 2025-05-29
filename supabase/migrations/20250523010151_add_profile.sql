CREATE TYPE user_status AS ENUM ('online', 'flowing', 'active', 'offline');

CREATE TABLE user_profile (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    online_status user_status DEFAULT 'offline',
    last_check_in TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    latitude INT NULL, -- rounded to closest integer (within 111km square)
    longitude INT NULL, -- rounded to closest integer (within 111km square)
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON user_profile
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own record
CREATE POLICY "Users can read own profile" 
    ON user_profile FOR SELECT 
    USING (auth.uid() = id);

-- Policy to allow users to update their own record
CREATE POLICY "Users can update own profile" 
    ON user_profile FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy to allow users to create their own record
CREATE POLICY "Users can create own profile" 
    ON user_profile FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- ROLLBACK:
-- DROP TABLE user_profile;
-- DROP TYPE user_status;
-- DELETE FROM supabase_migrations.schema_migrations WHERE version = '20250523010151';