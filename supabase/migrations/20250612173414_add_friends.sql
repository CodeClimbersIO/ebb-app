-- Enhanced FriendRequest table
CREATE TABLE friend_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES auth.users(id),
    to_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE, -- optional expiration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate requests
    UNIQUE(from_user_id, to_email)
);

-- Enhanced Friend table  
CREATE TABLE friend (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_1 UUID NOT NULL REFERENCES auth.users(id),
    user_id_2 UUID NOT NULL REFERENCES auth.users(id),
    friend_request_id UUID REFERENCES friend_request(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_user_order CHECK (user_id_1 < user_id_2),
    UNIQUE(user_id_1, user_id_2)
);

CREATE TRIGGER set_updated_at_friend_request
    BEFORE UPDATE ON friend_request
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_friend
    BEFORE UPDATE ON friend
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE friend_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend ENABLE ROW LEVEL SECURITY;

-- Friend Request Policies
-- Policy to allow users to read friend requests they sent or received
CREATE POLICY "Users can read their friend requests" ON friend_request
    FOR SELECT USING (
        auth.uid() = from_user_id OR 
        auth.email() = to_email
    );

-- Friend Policies  
-- Policy to allow users to read friendships they are part of
CREATE POLICY "Users can read their friendships" ON friend
    FOR SELECT USING (
        auth.uid() = user_id_1 OR 
        auth.uid() = user_id_2
    );

CREATE INDEX idx_friend_request_from_user ON friend_request(from_user_id);
CREATE INDEX idx_friend_request_to_email ON friend_request(to_email);
CREATE INDEX idx_friend_request_status ON friend_request(status);
CREATE INDEX idx_friend_user_1 ON friend(user_id_1);
CREATE INDEX idx_friend_user_2 ON friend(user_id_2);
CREATE INDEX idx_friend_status ON friend(status);