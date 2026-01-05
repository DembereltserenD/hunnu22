-- Add device_type column to detector_status_overrides
ALTER TABLE detector_status_overrides
ADD COLUMN IF NOT EXISTS device_type TEXT DEFAULT 'detector'
CHECK (device_type IN ('detector', 'commonArea', 'bell', 'mcp', 'relay'));

-- Update unique constraint to include device_type
ALTER TABLE detector_status_overrides
DROP CONSTRAINT IF EXISTS detector_status_overrides_building_id_unit_number_detector__key;

ALTER TABLE detector_status_overrides
ADD CONSTRAINT detector_status_overrides_unique
UNIQUE(building_id, unit_number, detector_address, device_type);

-- Add device_type column to detector_status_history
ALTER TABLE detector_status_history
ADD COLUMN IF NOT EXISTS device_type TEXT DEFAULT 'detector'
CHECK (device_type IN ('detector', 'commonArea', 'bell', 'mcp', 'relay'));

-- Create index for device-specific history queries
CREATE INDEX IF NOT EXISTS idx_detector_history_device
ON detector_status_history(building_id, unit_number, detector_address, device_type);

-- Add comments
COMMENT ON COLUMN detector_status_overrides.device_type IS 'Type of device: detector, commonArea, bell, mcp, relay';
COMMENT ON COLUMN detector_status_history.device_type IS 'Type of device that was changed';
