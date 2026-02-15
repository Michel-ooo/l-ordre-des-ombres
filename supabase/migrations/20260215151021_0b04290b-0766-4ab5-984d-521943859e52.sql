
-- Allow all authenticated users to see profiles (pseudonym, grade, id) for messaging
-- Currently only guardian can see all profiles, which prevents normal users from messaging

DROP POLICY IF EXISTS "Guardian can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- All authenticated users can view all profiles (needed for messaging, tribunal, etc.)
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
