-- Create phone issues table for tracking apartment phone number issues
CREATE TABLE IF NOT EXISTS phone_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('smoke_detector', 'domophone', 'light_bulb')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  description TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_phone_issues_apartment ON phone_issues(apartment_id);
CREATE INDEX IF NOT EXISTS idx_phone_issues_phone ON phone_issues(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_issues_type ON phone_issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_phone_issues_status ON phone_issues(status);
CREATE INDEX IF NOT EXISTS idx_phone_issues_worker ON phone_issues(worker_id);

-- Enable realtime for phone issues
ALTER PUBLICATION supabase_realtime ADD TABLE phone_issues;

-- Sample data will be added later through the UI or manually