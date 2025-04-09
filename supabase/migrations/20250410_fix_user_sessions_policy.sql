
-- Make sure the user_sessions table has proper RLS policies
ALTER TABLE IF EXISTS "public"."user_sessions" ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can only manage their own sessions" ON "public"."user_sessions";
DROP POLICY IF EXISTS "Users can view all sessions" ON "public"."user_sessions";
DROP POLICY IF EXISTS "Users can update their own sessions" ON "public"."user_sessions";
DROP POLICY IF EXISTS "Users can insert their own sessions" ON "public"."user_sessions";
DROP POLICY IF EXISTS "Users can delete their own sessions" ON "public"."user_sessions";
DROP POLICY IF EXISTS "Service role has full access to sessions" ON "public"."user_sessions";

-- Allow users to see all sessions (needed for activity checks)
CREATE POLICY "Users can view all sessions"
ON "public"."user_sessions"
FOR SELECT
TO authenticated
USING (true);

-- Allow users to update their own sessions
CREATE POLICY "Users can update their own sessions"
ON "public"."user_sessions"
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own sessions
CREATE POLICY "Users can insert their own sessions"
ON "public"."user_sessions"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own sessions
CREATE POLICY "Users can delete their own sessions"
ON "public"."user_sessions"
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow service role to do everything
CREATE POLICY "Service role has full access to sessions"
ON "public"."user_sessions"
FOR ALL
TO service_role
USING (true);

-- Make sure the table has the necessary indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON "public"."user_sessions" (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON "public"."user_sessions" (last_active);
