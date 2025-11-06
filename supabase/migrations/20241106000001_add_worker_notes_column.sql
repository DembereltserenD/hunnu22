-- Add worker_notes column to phone_issues table
ALTER TABLE phone_issues 
ADD COLUMN IF NOT EXISTS worker_notes TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN phone_issues.worker_notes IS 'Additional notes from worker, especially when status is "тусламж хэрэгтэй"';