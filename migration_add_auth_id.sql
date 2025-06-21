-- Migration: Add auth_id field and fix RLS policies

-- Step 1: Add auth_id column to existing users table
ALTER TABLE users ADD COLUMN auth_id uuid;

-- Step 2: Drop existing RLS policies
DROP POLICY IF EXISTS "users can read own data" ON users;
DROP POLICY IF EXISTS "users can update own data" ON users;
DROP POLICY IF EXISTS "users can insert own data" ON users;

-- Step 3: Create new RLS policies using auth_id
CREATE POLICY "users can read own data"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = auth_id);

CREATE POLICY "users can update own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_id);

CREATE POLICY "users can insert own data"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_id);

-- Step 4: Make auth_id unique and not null (after data migration if needed)
-- Note: Run this after populating auth_id for existing users
-- ALTER TABLE users ALTER COLUMN auth_id SET NOT NULL;
-- ALTER TABLE users ADD CONSTRAINT users_auth_id_unique UNIQUE (auth_id); 