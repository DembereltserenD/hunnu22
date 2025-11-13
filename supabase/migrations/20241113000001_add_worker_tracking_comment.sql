-- Add comment to document the importance of worker_id field
-- This field tracks which worker handled/changed the status of each phone issue
COMMENT ON COLUMN phone_issues.worker_id IS 'Tracks which worker handled this issue. Required when changing status to ensure accountability.';

-- Ensure the index exists for better query performance
CREATE INDEX IF NOT EXISTS idx_phone_issues_worker ON phone_issues(worker_id);
