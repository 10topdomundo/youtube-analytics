-- Create profiles for existing users who don't have them yet
-- This handles users who were created before the trigger was in place

INSERT INTO public.user_profiles (user_id, display_name, is_admin)
SELECT 
  id as user_id,
  COALESCE(raw_user_meta_data->>'display_name', email) as display_name,
  false as is_admin
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.user_profiles);

-- Set the current user as admin (replace with actual user ID)
-- You can find the user ID from the debug logs: 2fbe957b-5ebc-4509-98be-6110b818b2ba
UPDATE public.user_profiles 
SET is_admin = true 
WHERE user_id = '2fbe957b-5ebc-4509-98be-6110b818b2ba';
