-- Create table to track detector status change history
CREATE TABLE IF NOT EXISTS detector_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL,
    detector_address INTEGER NOT NULL,
    old_status TEXT CHECK (old_status IN ('ok', 'problem', 'warning')),
    new_status TEXT NOT NULL CHECK (new_status IN ('ok', 'problem', 'warning')),
    changed_by UUID REFERENCES users(id),
    changed_by_name TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_detector_history_building ON detector_status_history(building_id);
CREATE INDEX IF NOT EXISTS idx_detector_history_unit ON detector_status_history(building_id, unit_number);
CREATE INDEX IF NOT EXISTS idx_detector_history_address ON detector_status_history(building_id, unit_number, detector_address);
CREATE INDEX IF NOT EXISTS idx_detector_history_changed_at ON detector_status_history(changed_at DESC);

-- Add comments
COMMENT ON TABLE detector_status_history IS 'History of smoke detector status changes made by admins';
COMMENT ON COLUMN detector_status_history.old_status IS 'Previous status before change (null for first override)';
COMMENT ON COLUMN detector_status_history.new_status IS 'New status after change';
COMMENT ON COLUMN detector_status_history.changed_by_name IS 'Cached name of user who made the change';

-- Enable RLS
ALTER TABLE detector_status_history ENABLE ROW LEVEL SECURITY;

-- Policy: only admins can read history
CREATE POLICY "Only admins can read detector history" ON detector_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.user_id = auth.uid()::text
            AND users.role = 'admin'
        )
    );

-- Policy: only admins can insert history (done via API)
CREATE POLICY "Only admins can insert detector history" ON detector_status_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.user_id = auth.uid()::text
            AND users.role = 'admin'
        )
    );
