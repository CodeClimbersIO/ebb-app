-- Add session_id column to license_devices table
alter table license_devices 
add column if not exists session_id text;

-- Add an index to improve query performance when looking up by session_id
create index if not exists idx_license_devices_session_id 
on license_devices(session_id);

-- Add RLS policy to ensure users can only access their own devices
create policy "Users can only access their own devices"
on license_devices
for all
using (
  license_id in (
    select id 
    from licenses 
    where user_id = auth.uid()
  )
); 