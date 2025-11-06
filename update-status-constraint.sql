-- Run this SQL in your Supabase SQL editor to update the status constraint

-- First, check current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'phone_issues'::regclass 
AND contype = 'c';

-- Update the status check constraint to allow Mongolian status values
-- First, drop the existing constraint
ALTER TABLE phone_issues DROP CONSTRAINT IF EXISTS phone_issues_status_check;

-- Add new constraint with Mongolian status values
ALTER TABLE phone_issues 
ADD CONSTRAINT phone_issues_status_check 
CHECK (status IN ('open', 'хүлээж авсан', 'болсон', 'тусламж хэрэгтэй'));

-- Add comment to describe the new status values
COMMENT ON COLUMN phone_issues.status IS 'Status of the phone issue: open (initial), хүлээж авсан (received/acknowledged), болсон (completed), тусламж хэрэгтэй (needs help)';

-- Verify the new constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'phone_issues'::regclass 
AND contype = 'c';