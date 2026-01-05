-- Add role column to users table for admin detection
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Add check constraint for valid roles
ALTER TABLE users
ADD CONSTRAINT valid_user_role CHECK (role IN ('user', 'admin'));

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add comment
COMMENT ON COLUMN users.role IS 'User role: user or admin. Admins can toggle smoke detector statuses.';
