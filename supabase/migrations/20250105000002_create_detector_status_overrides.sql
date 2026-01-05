-- Create table to store manual detector status overrides
-- This allows admins to override the status of smoke detectors
CREATE TABLE IF NOT EXISTS detector_status_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL,
    detector_address INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ok', 'problem', 'warning')),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(building_id, unit_number, detector_address)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_detector_overrides_building ON detector_status_overrides(building_id);
CREATE INDEX IF NOT EXISTS idx_detector_overrides_unit ON detector_status_overrides(building_id, unit_number);
CREATE INDEX IF NOT EXISTS idx_detector_overrides_address ON detector_status_overrides(building_id, unit_number, detector_address);

-- Add comments
COMMENT ON TABLE detector_status_overrides IS 'Manual status overrides for smoke detectors, set by admins';
COMMENT ON COLUMN detector_status_overrides.status IS 'Override status: ok (green), problem (red), or warning (yellow)';

-- Enable RLS
ALTER TABLE detector_status_overrides ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read overrides
CREATE POLICY "Anyone can read detector overrides" ON detector_status_overrides
    FOR SELECT USING (true);

-- Policy: only admins can insert/update/delete
CREATE POLICY "Only admins can modify detector overrides" ON detector_status_overrides
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.user_id = auth.uid()::text
            AND users.role = 'admin'
        )
    );
