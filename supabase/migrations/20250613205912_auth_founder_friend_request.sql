-- Function to create automatic friend request from founder
CREATE OR REPLACE FUNCTION public.create_founder_friend_request()
RETURNS TRIGGER AS $$
DECLARE
    founder_id UUID := '409cf9b9-7aae-4a13-aca9-1bcd7b9a4209';
BEGIN
    -- Only create friend request if the new user is not the founder themselves
    IF NEW.id != founder_id THEN
        INSERT INTO public.friend_request (
            from_user_id,
            to_email,
            status
        ) VALUES (
            founder_id,
            NEW.email,
            'pending'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER 
   SET search_path = public;

-- Create trigger that fires when a new user is created
CREATE TRIGGER create_founder_friend_request_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_founder_friend_request();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_founder_friend_request() TO service_role;

-- Create friend requests for all existing users (except founder)
INSERT INTO public.friend_request (
    from_user_id,
    to_email,
    status
) 
SELECT 
    '409cf9b9-7aae-4a13-aca9-1bcd7b9a4209'::UUID as from_user_id,
    u.email,
    'pending' as status
FROM auth.users u
WHERE u.id != '409cf9b9-7aae-4a13-aca9-1bcd7b9a4209'::UUID
  AND u.email IS NOT NULL
  AND NOT EXISTS (
    -- Avoid duplicate friend requests if any already exist
    SELECT 1 FROM public.friend_request fr 
    WHERE fr.from_user_id = '409cf9b9-7aae-4a13-aca9-1bcd7b9a4209'::UUID 
      AND fr.to_email = u.email
  );

-- ROLLBACK:
-- DROP TRIGGER IF EXISTS create_founder_friend_request_trigger ON auth.users;
-- DROP FUNCTION IF EXISTS public.create_founder_friend_request();
-- DELETE FROM public.friend_request WHERE from_user_id = '409cf9b9-7aae-4a13-aca9-1bcd7b9a4209';
-- DELETE FROM supabase_migrations.schema_migrations WHERE version = '20250614000000'; 