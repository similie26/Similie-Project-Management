-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "assignees" TEXT[] NOT NULL,
  "dueDate" TEXT,
  "priority" TEXT,
  "category" TEXT,
  "progress" INTEGER,
  "comments" INTEGER,
  "attachments" INTEGER,
  "description" TEXT,
  "subtasks" JSONB,
  "projectId" TEXT,
  "dependencies" TEXT[],
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "members" INTEGER DEFAULT 1,
  "activeTasks" INTEGER DEFAULT 0,
  "progress" INTEGER DEFAULT 0,
  "status" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies (Allowing all for now, you should restrict this in production)
CREATE POLICY "Allow all access to tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to projects" ON projects FOR ALL USING (true) WITH CHECK (true);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  invited_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow admins to manage invitations" ON invitations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anyone to check their invitation" ON invitations FOR SELECT USING (true);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "avatar" TEXT,
  "role" TEXT,
  "bio" TEXT,
  "preferences" JSONB DEFAULT '{"notifications": true, "darkMode": false, "language": "en"}'::jsonb,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow all access to profiles" ON profiles;
CREATE POLICY "Allow all access to profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- Storage setup for avatars
-- Note: These must be run in the Supabase SQL Editor
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Anyone can upload an avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
-- CREATE POLICY "Anyone can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
