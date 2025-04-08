-- Create enum for license status
CREATE TYPE public.license_status AS ENUM ('active', 'trialing', 'expired');

-- Create enum for license type
CREATE TYPE public.license_type AS ENUM ('perpetual', 'subscription');

-- Create licenses table
CREATE TABLE public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status license_status NOT NULL DEFAULT 'active',
    license_type license_type NOT NULL DEFAULT 'perpetual',
    purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    stripe_customer_id TEXT,
    stripe_payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create active devices table
CREATE TABLE public.active_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.licenses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_devices ENABLE ROW LEVEL SECURITY;

-- Licenses policies
CREATE POLICY "Users can view their own license"
    ON public.licenses FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Only service role can insert licenses"
    ON public.licenses FOR INSERT
    WITH CHECK (false);  -- Only allow through service role

CREATE POLICY "Only service role can update licenses"
    ON public.licenses FOR UPDATE
    USING (false);  -- Only allow through service role

-- Active devices policies
CREATE POLICY "Users can view their own devices"
    ON public.active_devices FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can register their own devices"
    ON public.active_devices FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- No UPDATE policy needed if we just insert/delete

CREATE POLICY "Users can delete their own devices"
    ON public.active_devices FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_licenses_user_id ON public.licenses(user_id);
CREATE INDEX idx_active_devices_user_id ON public.active_devices(user_id);
CREATE INDEX idx_active_devices_device_id ON public.active_devices(device_id);
-- Removed index on is_active

-- Grant permissions
GRANT SELECT ON public.licenses TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.active_devices TO authenticated;
-- Removed UPDATE grant 