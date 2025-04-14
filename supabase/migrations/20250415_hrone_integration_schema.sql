
-- Update departments table to add external_id and parent_id columns
ALTER TABLE departments 
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS parent_id text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Create unique index on external_id for departments
CREATE UNIQUE INDEX IF NOT EXISTS departments_external_id_idx ON departments (external_id) 
  WHERE external_id IS NOT NULL;

-- Update team_members table for HROne integration
ALTER TABLE team_members 
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS employee_id text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active';

-- Create unique index on external_id for team_members
CREATE UNIQUE INDEX IF NOT EXISTS team_members_external_id_idx ON team_members (external_id) 
  WHERE external_id IS NOT NULL;

-- Create table for sync logs
CREATE TABLE IF NOT EXISTS hrone_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL,
  entity_type text NOT NULL,
  status text NOT NULL,
  records_processed integer DEFAULT 0,
  errors jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_by uuid REFERENCES auth.users(id)
);

-- Create table for sync configuration
CREATE TABLE IF NOT EXISTS hrone_sync_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_sync boolean DEFAULT false,
  sync_interval integer DEFAULT 24,
  sync_employees boolean DEFAULT true,
  sync_departments boolean DEFAULT true,
  last_sync_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Insert default sync configuration if not exists
INSERT INTO hrone_sync_config (id, auto_sync, sync_interval)
SELECT gen_random_uuid(), false, 24
WHERE NOT EXISTS (SELECT 1 FROM hrone_sync_config);
