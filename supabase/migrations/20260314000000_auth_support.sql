-- Add walk_preferences JSONB column to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS walk_preferences jsonb;

-- Trigger: auto-create public.users row when auth.users row is created
-- display_name comes from raw_user_meta_data set during signInWithOtp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to make idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SECURITY DEFINER function to consume invite tokens
-- Called via supabase.rpc('consume_invite', { p_token, p_user_id })
-- Bypasses RLS so the newly-authenticated user can mark token as used
CREATE OR REPLACE FUNCTION public.consume_invite(p_token text, p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.invitations
  SET used_by = p_user_id, used_at = now()
  WHERE token = p_token AND used_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
