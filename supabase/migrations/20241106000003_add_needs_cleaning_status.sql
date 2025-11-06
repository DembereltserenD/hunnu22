-- Add 'цэвэрлэх хэрэгтэй' (needs cleaning) status to phone_issues table

-- First, drop the existing constraint
ALTER TABLE phone_issues DROP CONSTRAINT IF EXISTS phone_issues_status_check;

-- Add new constraint with the additional status value
ALTER TABLE phone_issues 
ADD CONSTRAINT phone_issues_status_check 
CHECK (status IN ('open', 'хүлээж авсан', 'болсон', 'тусламж хэрэгтэй', 'цэвэрлэх хэрэгтэй'));