-- Create worker_requests table
CREATE TABLE IF NOT EXISTS worker_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  worker_name TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('equipment', 'supplies', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_worker_requests_worker_id ON worker_requests(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_requests_status ON worker_requests(status);
CREATE INDEX IF NOT EXISTS idx_worker_requests_created_at ON worker_requests(created_at DESC);

-- Enable RLS
ALTER TABLE worker_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON worker_requests
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON worker_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON worker_requests
  FOR UPDATE USING (true);
